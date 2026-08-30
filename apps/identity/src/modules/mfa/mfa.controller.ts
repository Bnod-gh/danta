import { Controller, Post, Body, UseGuards, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MfaService } from './mfa.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('auth/mfa')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Post('setup')
  @RequirePermissions('settings:manage')
  async setup(@CurrentUser() user: AuthenticatedUser) {
    const userId = user.id;
    if (!userId) throw new UnauthorizedException();
    const result = await this.mfaService.setup(userId);
    return result;
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verify(@CurrentUser() user: AuthenticatedUser, @Body() body: { code: string }) {
    const userId = user.id;
    if (!userId) throw new UnauthorizedException();
    const result = await this.mfaService.verify(userId, body.code);
    return result;
  }

  @Post('disable')
  @RequirePermissions('settings:manage')
  async disable(@CurrentUser() user: AuthenticatedUser, @Body() body: { code: string }) {
    const userId = user.id;
    if (!userId) throw new UnauthorizedException();
    const result = await this.mfaService.disable(userId, body.code);
    return result;
  }
}
