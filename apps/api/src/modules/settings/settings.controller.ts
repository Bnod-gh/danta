import { Controller, Get, Put, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { SettingsService } from './settings.service';
import type { Setting } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions('settings:manage')
  async findAll(@Req() req: Request) {
    const user = req.user as any;
    return this.settingsService.findAll(user.tenantId);
  }

  @Put(':key')
  @RequirePermissions('settings:manage')
  async upsert(@Req() req: Request, @Param('key') key: string, @Body() body: Setting) {
    const user = req.user as any;
    if (body.key !== key) {
      throw new BadRequestException('Key mismatch');
    }
    return this.settingsService.upsert(user.tenantId, key, body.value);
  }
}
