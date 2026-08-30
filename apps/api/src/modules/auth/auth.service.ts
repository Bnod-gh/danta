import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { Response } from 'express';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma.service';
import { MfaService } from '../mfa/mfa.service';
import { ConfigService } from '@nestjs/config';
import { LoginAttemptService } from './services/login-attempt.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
  practiceId?: string;
  locationId?: string;
  permissions?: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_COOKIE_MAX_AGE_MS  = 15 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const base = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict' as const,
    path: '/',
  };
  res.cookie('accessToken', accessToken, { ...base, maxAge: ACCESS_COOKIE_MAX_AGE_MS });
  res.cookie('refreshToken', refreshToken, {
    ...base,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: '/api/v1/auth',
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
    private readonly mfaService: MfaService,
    private readonly configService: ConfigService,
    private readonly loginAttemptService: LoginAttemptService,
  ) {}

  private async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleAssignments: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });
    if (!user) return [];
    
    const permissionsSet = new Set<string>();
    for (const assignment of user.roleAssignments as any[]) {
      for (const rp of assignment.role.permissions) {
        if (rp.permission) {
          permissionsSet.add(`${rp.permission.resource}:${rp.permission.action}`);
        }
      }
    }
    return Array.from(permissionsSet);
  }

  async validateUser(email: string, password: string) {
    const isLocked = await this.loginAttemptService.isLocked(email);
    if (isLocked) {
      throw new BadRequestException('Account temporarily locked due to too many failed attempts. Please try again later.');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      await this.loginAttemptService.recordAttempt(email, false);
      return null;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await this.loginAttemptService.recordAttempt(email, false);
      return null;
    }
    await this.loginAttemptService.recordAttempt(email, true);
    return user;
  }

  async login(
    user: { id: string; email: string; role: string; tenantId: string; practiceId: string | null; locationId: string | null; status: string },
    mfaCode?: string,
    res?: Response,
  ) {
    const mfaFactor = await this.prisma.mFAFactor.findFirst({ where: { userId: user.id, verified: true } });
    if (mfaFactor) {
      if (!mfaCode) {
        throw new UnauthorizedException('MFA_REQUIRED');
      }
      const isValid = this.mfaService.verifyTOTP(mfaFactor.secret, mfaCode);
      if (!isValid) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    const permissions = await this.getUserPermissions(user.id);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      practiceId: user.practiceId ?? undefined,
      locationId: user.locationId ?? undefined,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY') as any,
    });

    await this.usersService.createSession(user.id, refreshToken);
    await this.auditService.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'auth.login',
      result: 'success',
    });

    if (res) {
      setAuthCookies(res, accessToken, refreshToken);
      return { message: 'Logged in successfully' };
    }
    return { accessToken, refreshToken };
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string; tenantId: string; role: string }, res?: Response) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await this.usersService.create({
      ...data,
      passwordHash,
    }, undefined);
    return this.login(user, undefined, res);
  }

  async refresh(rawRefreshToken: string, res?: Response): Promise<TokenPair | { message: string }> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(rawRefreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.usersService.findSessionByRefreshToken(rawRefreshToken);
    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const user = await this.usersService.findById(undefined, payload.sub);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User not found or inactive');
    }

    await this.usersService.revokeSession(session.id);
    
    const permissions = await this.getUserPermissions(user.id);

    const newPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role, // Q13: Fresh role loaded from DB!
      tenantId: user.tenantId,
      practiceId: user.practiceId ?? undefined,
      locationId: user.locationId ?? undefined,
      permissions,
    };

    const accessToken = this.jwtService.sign(newPayload);
    const newRefreshToken = this.jwtService.sign(newPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY') as any,
    });

    await this.usersService.createSession(user.id, newRefreshToken);

    if (res) {
      setAuthCookies(res, accessToken, newRefreshToken);
      return { message: 'Tokens refreshed' };
    }
    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(rawRefreshToken: string, res?: Response): Promise<{ message: string }> {
    const session = await this.usersService.findSessionByRefreshToken(rawRefreshToken);
    if (session) {
      await this.usersService.revokeSession(session.id);
    }
    if (res) {
      clearAuthCookies(res);
    }
    return { message: 'Logged out successfully' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organisation: { select: { id: true, name: true, status: true } },
        practice: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        roleAssignments: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    
    if (!user) throw new UnauthorizedException('User not found');

    const permissionsSet = new Set<string>();
    for (const assignment of user.roleAssignments as any[]) {
      for (const rp of assignment.role.permissions) {
        if (rp.permission) {
          permissionsSet.add(`${rp.permission.resource}:${rp.permission.action}`);
        }
      }
    }

    const superadminEmail = this.configService.get<string>('SUPERADMIN_EMAIL');
    const isSuperadmin = superadminEmail && user.email?.toLowerCase() === superadminEmail.toLowerCase();

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: isSuperadmin ? 'superadmin' : user.role,
        status: user.status,
        tenantId: user.tenantId,
        practiceId: user.practiceId,
        locationId: user.locationId,
        isSuperadmin: !!isSuperadmin,
      },
      tenant: user.organisation,
      practice: user.practice,
      location: user.location,
      permissions: Array.from(permissionsSet),
    };
  }
}
