import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import type { Login, Register, Refresh } from '@danta/schemas';
import { AuditService } from '../audit/audit.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly auditService: AuditService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: Request, @Body() body: Login & { mfaCode?: string }) {
    try {
      const user = await this.authService.validateUser(body.email, body.password);
      if (!user) {
        await this.auditService.log({
          tenantId: 'unknown',
          action: 'auth.login',
          result: 'failure',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] as string | undefined,
        });
        throw new Error('Invalid credentials');
      }
      return this.authService.login(user, body.mfaCode);
    } catch (error) {
      await this.auditService.log({
        tenantId: 'unknown',
        action: 'auth.login',
        result: 'failure',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string | undefined,
      });
      throw error;
    }
  }

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: Register) {
    return this.authService.register(body);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: Refresh) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @CurrentUser() user: AuthenticatedUser, @Body() body: Refresh) {
    const result = await this.authService.logout(body.refreshToken);
    if (user) {
      await this.auditService.log({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'auth.logout',
        result: 'success',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string | undefined,
      });
    }
    return result;
  }
}
