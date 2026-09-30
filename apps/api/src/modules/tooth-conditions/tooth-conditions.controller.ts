import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ToothConditionsService } from './tooth-conditions.service';
import type { CreateToothCondition, UpdateToothCondition } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('tooth-conditions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ToothConditionsController {
  constructor(private readonly toothConditionsService: ToothConditionsService) {}

  @Get()
  @RequirePermissions('dental_chart:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('dentalChartId') dentalChartId?: string) {
    return this.toothConditionsService.findAll(user.tenantId, dentalChartId);
  }

  @Get(':id')
  @RequirePermissions('dental_chart:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.toothConditionsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('dental_chart:update')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateToothCondition) {
    return this.toothConditionsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('dental_chart:update')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateToothCondition) {
    return this.toothConditionsService.update(user.tenantId, user.id, id, body);
  }

  @Post(':id/promote')
  @RequirePermissions('dental_chart:update')
  async promote(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body('planId') planId?: string) {
    return this.toothConditionsService.promoteToTreatmentPlan(user.tenantId, user.id, id, planId);
  }

  @Delete(':id')
  @RequirePermissions('dental_chart:update')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.toothConditionsService.remove(user.tenantId, user.id, id);
  }
}
