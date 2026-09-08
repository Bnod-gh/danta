import { Controller, Get, Post, Body, Param, Query, Put, Delete, UseGuards } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ToothConditionConfigsService } from './tooth-condition-configs.service';
import type { CreateToothConditionConfig, UpdateToothConditionConfig } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('tooth-condition-configs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ToothConditionConfigsController {
  constructor(private readonly service: ToothConditionConfigsService) {}

  @Get()
  @RequirePermissions('settings:read')
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('active') active?: string,
  ) {
    const activeFilter = active === undefined ? undefined : active === 'true';
    return this.service.findAll(user.tenantId, activeFilter);
  }

  @Get(':id')
  @RequirePermissions('settings:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('settings:update')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateToothConditionConfig) {
    return this.service.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('settings:update')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateToothConditionConfig) {
    return this.service.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('settings:update')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.remove(user.tenantId, user.id, id);
  }
}
