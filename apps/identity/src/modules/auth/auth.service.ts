import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma.service';
import { MfaService } from '../mfa/mfa.service';
import { ConfigService } from '@nestjs/config';
import { LoginAttemptService } from '../login-attempts/login-attempt.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
  practiceId?: string;
  locationId?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mfaService: MfaService,
    private readonly configService: ConfigService,
    private readonly loginAttemptService: LoginAttemptService,
  ) {}

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

  async login(user: { id: string; email: string; role: string; tenantId: string; practiceId: string | null; locationId: string | null; status: string }, mfaCode?: string) {
    const mfaFactor = await this.prisma.mFAFactor.findFirst({ where: { userId: user.id, verified: true } });
    if (mfaFactor) {
      if (!mfaCode) {
        throw new UnauthorizedException('MFA_REQUIRED');
      }
      const result = await this.validateMfaToken(user.id, mfaCode);
      if (!result.valid) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      practiceId: user.practiceId ?? undefined,
      locationId: user.locationId ?? undefined,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY') as any,
    });

    await this.usersService.createSession(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string }) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    const organisation = await this.prisma.organisation.create({
      data: { name: `${data.firstName} ${data.lastName}'s Practice` },
    });
    const user = await this.usersService.create({
      ...data,
      tenantId: organisation.id,
      organisationId: organisation.id,
      role: 'organisation_owner',
      passwordHash,
    }, undefined);
    return this.login(user);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const session = await this.usersService.findSessionByRefreshToken(refreshToken);
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(session.userId);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User not found or inactive');
    }

    await this.usersService.revokeSession(session.id);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      practiceId: user.practiceId ?? undefined,
      locationId: user.locationId ?? undefined,
    };

    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY') as any,
    });

    await this.usersService.createSession(user.id, newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    const session = await this.usersService.findSessionByRefreshToken(refreshToken);
    if (session) {
      await this.usersService.revokeSession(session.id);
    }
    return { message: 'Logged out successfully' };
  }

  async enableMfa(userId: string) {
    const secret = this.mfaService.generateSecret();
    const backupCodes = this.mfaService.generateBackupCodes();
    const hashedCodes = backupCodes.map((code) => this.mfaService.hashBackupCode(code));

    const existing = await this.prisma.mFAFactor.findFirst({ where: { userId } });
    if (existing) {
      await this.prisma.mFAFactor.update({
        where: { id: existing.id },
        data: { secret, type: 'totp', verified: false, backupCodes: hashedCodes },
      });
    } else {
      await this.prisma.mFAFactor.create({
        data: { userId, secret, type: 'totp', verified: false, backupCodes: hashedCodes },
      });
    }

    return { secret, backupCodes };
  }

  async validateMfaToken(userId: string, token: string) {
    const factor = await this.prisma.mFAFactor.findFirst({ where: { userId, verified: true } });
    if (!factor) {
      throw new BadRequestException('MFA not enabled');
    }

    if (token.length <= 8 && factor.backupCodes) {
      const codes = factor.backupCodes as string[];
      const hashedToken = this.mfaService.hashBackupCode(token);
      const index = codes.findIndex((c) => c === hashedToken);
      if (index !== -1) {
        const newCodes = [...codes];
        newCodes.splice(index, 1);
        await this.prisma.mFAFactor.update({
          where: { id: factor.id },
          data: { backupCodes: newCodes },
        });
        return { valid: true, method: 'backup' };
      }
    }

    const isValid = this.mfaService.verifyTOTP(factor.secret, token);
    if (isValid) {
      return { valid: true, method: 'totp' };
    }

    throw new UnauthorizedException('Invalid MFA token');
  }

  async disableMfa(userId: string) {
    const factor = await this.prisma.mFAFactor.findFirst({ where: { userId, verified: true } });
    if (!factor) {
      throw new BadRequestException('MFA not enabled');
    }

    await this.prisma.mFAFactor.delete({ where: { id: factor.id } });
    return { disabled: true };
  }

  async generateBackupCodes(userId: string) {
    const factor = await this.prisma.mFAFactor.findFirst({ where: { userId, verified: true } });
    if (!factor) {
      throw new BadRequestException('MFA not enabled');
    }

    const backupCodes = this.mfaService.generateBackupCodes();
    const hashedCodes = backupCodes.map((code) => this.mfaService.hashBackupCode(code));

    await this.prisma.mFAFactor.update({
      where: { id: factor.id },
      data: { backupCodes: hashedCodes },
    });

    return { backupCodes };
  }

  async verifyBackupCode(userId: string, code: string) {
    return this.validateMfaToken(userId, code);
  }
}
