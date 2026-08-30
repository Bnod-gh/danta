import { Controller, Get, Post, Body, HttpCode, HttpStatus, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import type { Login, Register } from '@danta/schemas';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { InvitationsService } from '../invitations/invitations.service';
import { ApiKeysService } from '../api-keys/api-keys.service';

@Controller('auth')
@SkipThrottle()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
    private readonly invitationsService: InvitationsService,
    private readonly apiKeysService: ApiKeysService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.id);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() body: Login & { mfaCode?: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      // S9: audit failure only for the actual credential failure, not for MFA_REQUIRED
      await this.auditService.log({
        tenantId: 'unknown',
        action: 'auth.login',
        result: 'failure',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string | undefined,
      });
      throw new UnauthorizedException('Invalid credentials');
    }
    // login() may throw MFA_REQUIRED — that is NOT a failure, so no failure audit here
    return this.authService.login(user, body.mfaCode, res);
  }

  /**
   * S3: Registration is gated behind a valid invitation token.
   * Use POST /invitations to create an invite, then complete registration here.
   */
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  async register(@Res({ passthrough: true }) res: Response, @Body() body: Register & { inviteToken: string }) {
    // Validate the invitation and create the user atomically via InvitationsService
    const user = await this.invitationsService.accept(body.inviteToken, {
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
    });

    // Log the new user in immediately after registration
    return this.authService.login(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: (user as any).tenantId,
        practiceId: null,
        locationId: null,
        status: 'active',
      },
      undefined,
      res,
    );
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Accept token from HttpOnly cookie (preferred) or body fallback for API clients
    const rawToken: string =
      req.cookies?.['refreshToken'] ??
      (req.body as { refreshToken?: string })?.refreshToken;
    if (!rawToken) {
      throw new UnauthorizedException('No refresh token provided');
    }
    return this.authService.refresh(rawToken, res);
  }

  @Post('validate-api-key')
  @HttpCode(HttpStatus.OK)
  async validateApiKey(@Body() body: { secret: string }) {
    const result = await this.apiKeysService.validateKey(body.secret);
    if (!result) {
      throw new UnauthorizedException('Invalid API key');
    }
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response, @CurrentUser() user: AuthenticatedUser) {
    const rawToken: string =
      req.cookies?.['refreshToken'] ??
      (req.body as { refreshToken?: string })?.refreshToken ?? '';

    const result = await this.authService.logout(rawToken, res);
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
