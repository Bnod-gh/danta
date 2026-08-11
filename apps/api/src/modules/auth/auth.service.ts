import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma.service';
import { MfaService } from '../mfa/mfa.service';
import { ConfigService } from '@nestjs/config';

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
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
    private readonly mfaService: MfaService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    return user;
  }

  async login(user: { id: string; email: string; role: string; tenantId: string; practiceId: string | null; locationId: string | null; status: string }, mfaCode?: string) {
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
    await this.auditService.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'auth.login',
      result: 'success',
    });

    return { accessToken, refreshToken };
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string; tenantId: string; role: string }) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await this.usersService.create({
      ...data,
      passwordHash,
    });
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
}
