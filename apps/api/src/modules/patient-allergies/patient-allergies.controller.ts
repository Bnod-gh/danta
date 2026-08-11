import { Controller, Get, Post, Body, Param, UseGuards, Req, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
import { PatientAllergiesService } from './patient-allergies.service';
import type { CreatePatientAllergy, UpdatePatientAllergy } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('patients/:patientId/allergies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientAllergiesController {
  constructor(private readonly patientAllergiesService: PatientAllergiesService) {}

  @Get()
  @RequirePermissions('patient:read')
  async findAll(@Req() req: Request, @Param('patientId') patientId: string) {
    const user = req.user as any;
    return this.patientAllergiesService.findAll(user.tenantId, patientId);
  }

  @Post()
  @RequirePermissions('patient:update')
  async create(@Req() req: Request, @Param('patientId') patientId: string, @Body() body: CreatePatientAllergy) {
    const user = req.user as any;
    return this.patientAllergiesService.create(user.tenantId, patientId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('patient:update')
  async update(@Req() req: Request, @Param('patientId') patientId: string, @Param('id') id: string, @Body() body: UpdatePatientAllergy) {
    const user = req.user as any;
    return this.patientAllergiesService.update(user.tenantId, patientId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('patient:update')
  async remove(@Req() req: Request, @Param('patientId') patientId: string, @Param('id') id: string) {
    const user = req.user as any;
    return this.patientAllergiesService.remove(user.tenantId, patientId, user.id, id);
  }
}
