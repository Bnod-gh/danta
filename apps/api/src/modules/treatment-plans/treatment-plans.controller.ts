import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { TreatmentPlansService } from './treatment-plans.service';
import type { CreateTreatmentPlan, UpdateTreatmentPlan } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('treatment-plans')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TreatmentPlansController {
  constructor(private readonly treatmentPlansService: TreatmentPlansService) {}

  @Get()
  @RequirePermissions('treatment_plan:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('patientId') patientId?: string, @Query('skip', ParseIntPipe) skip?: number, @Query('take', ParseIntPipe) take?: number) {
    return this.treatmentPlansService.findAll(user.tenantId, patientId, skip, take);
  }

  @Get(':id')
  @RequirePermissions('treatment_plan:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.treatmentPlansService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('treatment_plan:create')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateTreatmentPlan) {
    return this.treatmentPlansService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('treatment_plan:approve')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateTreatmentPlan) {
    return this.treatmentPlansService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('treatment_plan:approve')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.treatmentPlansService.remove(user.tenantId, user.id, id);
  }
}
