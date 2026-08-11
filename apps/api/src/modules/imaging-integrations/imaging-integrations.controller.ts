import { Controller, Get, Post, Body, Param, UseGuards, Req, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
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
  async findAll(@Req() req: Request) {
    const user = req.user as any;
    return this.imagingIntegrationsService.findAll(user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('settings:manage')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.imagingIntegrationsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('settings:manage')
  async create(@Req() req: Request, @Body() body: CreateImagingIntegration) {
    const user = req.user as any;
    return this.imagingIntegrationsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('settings:manage')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateImagingIntegration) {
    const user = req.user as any;
    return this.imagingIntegrationsService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('settings:manage')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.imagingIntegrationsService.remove(user.tenantId, user.id, id);
  }
}
