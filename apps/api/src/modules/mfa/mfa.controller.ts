import { Controller, Post, Body, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { MfaService } from './mfa.service';
import type { MFAVerify, MFADisable } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('auth/mfa')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Post('setup')
  @RequirePermissions('settings:manage')
  async setup(@Req() req: Request) {
    const userId = (req.user as any)?.id;
    if (!userId) throw new UnauthorizedException();
    const result = await this.mfaService.setup(userId);
    return result;
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  async verify(@Req() req: Request, @Body() body: MFAVerify) {
    const userId = (req.user as any)?.id;
    if (!userId) throw new UnauthorizedException();
    return this.mfaService.verify(userId, body.code);
  }

  @Post('disable')
  @RequirePermissions('settings:manage')
  async disable(@Req() req: Request, @Body() body: MFADisable) {
    const userId = (req.user as any)?.id;
    if (!userId) throw new UnauthorizedException();
    return this.mfaService.disable(userId, body.code);
  }
}
