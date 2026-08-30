import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TreatmentPlanItemsService } from './treatment-plan-items.service';
import type { CreateTreatmentPlanItem, TransitionTreatmentPlanItem, UpdateTreatmentPlanItem } from '@danta/schemas';

@Controller('treatment-plan-items')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TreatmentPlanItemsController {
  constructor(private readonly itemsService: TreatmentPlanItemsService) {}

  @Get()
  @RequirePermissions('treatment_plan:read')
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('planId') planId?: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('statuses') statuses?: string,
  ) {
    return this.itemsService.findAll(user.tenantId, {
      planId,
      patientId,
      status,
      statuses: statuses ? statuses.split(',').filter(Boolean) : undefined,
    });
  }

  @Get(':id')
  @RequirePermissions('treatment_plan:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.itemsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('treatment_plan:create')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateTreatmentPlanItem) {
    return this.itemsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('treatment_plan:update')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateTreatmentPlanItem) {
    return this.itemsService.update(user.tenantId, user.id, id, body);
  }

  @Post(':id/transition')
  @RequirePermissions('treatment_plan:update')
  async transition(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: TransitionTreatmentPlanItem) {
    return this.itemsService.transition(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('treatment_plan:update')
  async cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.itemsService.cancel(user.tenantId, user.id, id);
  }
}
