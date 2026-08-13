import { Controller, Get, Post, Body, Param, UseGuards, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ImagingIntegrationsService } from './imaging-integrations.service';
import type { CreateImagingIntegration, UpdateImagingIntegration } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('imaging-integrations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ImagingIntegrationsController {
  constructor(private readonly imagingIntegrationsService: ImagingIntegrationsService) {}

  @Get()
  @RequirePermissions('settings:manage')
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.imagingIntegrationsService.findAll(user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('settings:manage')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.imagingIntegrationsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('settings:manage')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateImagingIntegration) {
    return this.imagingIntegrationsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('settings:manage')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateImagingIntegration) {
    return this.imagingIntegrationsService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('settings:manage')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.imagingIntegrationsService.remove(user.tenantId, user.id, id);
  }
}
