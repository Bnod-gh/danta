import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { FeesService } from './fees.service';
import type { CreateFeeSchedule, UpdateFeeSchedule } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('fees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Get()
  @RequirePermissions('billing:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('serviceId') serviceId?: string) {
    return this.feesService.findAll(user.tenantId, serviceId);
  }

  @Get(':id')
  @RequirePermissions('billing:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.feesService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('billing:create')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateFeeSchedule) {
    return this.feesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('billing:create')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateFeeSchedule) {
    return this.feesService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('billing:create')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.feesService.remove(user.tenantId, user.id, id);
  }
}
