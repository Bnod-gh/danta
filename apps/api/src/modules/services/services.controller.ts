import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
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
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('category') category?: string) {
    return this.servicesService.findAll(user.tenantId, category);
  }

  @Get(':id')
  @RequirePermissions('billing:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.servicesService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('billing:create')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateService) {
    return this.servicesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('billing:create')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateService) {
    return this.servicesService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('billing:create')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.servicesService.remove(user.tenantId, user.id, id);
  }
}
