import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { Request } from 'express';
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
  async findAll(@Req() req: Request, @Query('patientId') patientId?: string, @Query('skip', ParseIntPipe) skip?: number, @Query('take', ParseIntPipe) take?: number) {
    const user = req.user as any;
    return this.treatmentPlansService.findAll(user.tenantId, patientId, skip, take);
  }

  @Get(':id')
  @RequirePermissions('treatment_plan:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.treatmentPlansService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('treatment_plan:create')
  async create(@Req() req: Request, @Body() body: CreateTreatmentPlan) {
    const user = req.user as any;
    return this.treatmentPlansService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('treatment_plan:approve')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateTreatmentPlan) {
    const user = req.user as any;
    return this.treatmentPlansService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('treatment_plan:approve')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.treatmentPlansService.remove(user.tenantId, user.id, id);
  }
}
