import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
import { ServicesService } from './services.service';
import type { CreateService, UpdateService } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('services')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @RequirePermissions('billing:read')
  async findAll(@Req() req: Request, @Query('category') category?: string) {
    const user = req.user as any;
    return this.servicesService.findAll(user.tenantId, category);
  }

  @Get(':id')
  @RequirePermissions('billing:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.servicesService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('billing:create')
  async create(@Req() req: Request, @Body() body: CreateService) {
    const user = req.user as any;
    return this.servicesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('billing:create')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateService) {
    const user = req.user as any;
    return this.servicesService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('billing:create')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.servicesService.remove(user.tenantId, user.id, id);
  }
}
