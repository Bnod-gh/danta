import { Controller, Get, Put, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
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
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.findAll(user.tenantId);
  }

  @Put(':key')
  @RequirePermissions('settings:manage')
  async upsert(@CurrentUser() user: AuthenticatedUser, @Param('key') key: string, @Body() body: Setting) {
    if (body.key !== key) {
      throw new BadRequestException('Key mismatch');
    }
    return this.settingsService.upsert(user.tenantId, key, body.value, user.id);
  }
}
