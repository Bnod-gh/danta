import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions('settings:manage')
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.findAll(user.tenantId);
  }

  @Post()
  @RequirePermissions('settings:manage')
  async upsert(@CurrentUser() user: AuthenticatedUser, @Body() body: { key: string; value: Record<string, any> }) {
    return this.settingsService.upsert(user.tenantId, body.key, body.value, user.id);
  }
}
