import { Controller, Post, Body, UseGuards, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MfaService } from './mfa.service';
import type { MFAVerify, MFADisable } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

@Controller('auth/mfa')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MfaController {
  constructor(private readonly mfaService: MfaService, private readonly auditService: AuditService) {}

  @Post('setup')
  @RequirePermissions('settings:manage')
  async setup(@CurrentUser() user: AuthenticatedUser) {
    const userId = user.id;
    if (!userId) throw new UnauthorizedException();
    const result = await this.mfaService.setup(userId);
    await this.auditService.log({
      tenantId: user.tenantId,
      userId,
      action: 'mfa.setup',
      result: 'success',
    });
    return result;
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verify(@CurrentUser() user: AuthenticatedUser, @Body() body: MFAVerify) {
    const userId = user.id;
    if (!userId) throw new UnauthorizedException();
    const result = await this.mfaService.verify(userId, body.code);
    await this.auditService.log({
      tenantId: user.tenantId,
      userId,
      action: 'mfa.verify',
      result: result.verified ? 'success' : 'failure',
    });
    return result;
  }

  @Post('disable')
  @RequirePermissions('settings:manage')
  async disable(@CurrentUser() user: AuthenticatedUser, @Body() body: MFADisable) {
    const userId = user.id;
    if (!userId) throw new UnauthorizedException();
    const result = await this.mfaService.disable(userId, body.code);
    await this.auditService.log({
      tenantId: user.tenantId,
      userId,
      action: 'mfa.disable',
      result: result.disabled ? 'success' : 'failure',
    });
    return result;
  }
}
