import { Controller, Get, Post, Body, Param, UseGuards, Req, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
import { PatientMedicalHistoryService } from './patient-medical-history.service';
import type { CreatePatientMedicalHistory, UpdatePatientMedicalHistory } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('patients/:patientId/medical-history')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientMedicalHistoryController {
  constructor(private readonly patientMedicalHistoryService: PatientMedicalHistoryService) {}

  @Get()
  @RequirePermissions('patient:read')
  async findAll(@Req() req: Request, @Param('patientId') patientId: string) {
    const user = req.user as any;
    return this.patientMedicalHistoryService.findAll(user.tenantId, patientId);
  }

  @Post()
  @RequirePermissions('patient:update')
  async create(@Req() req: Request, @Param('patientId') patientId: string, @Body() body: CreatePatientMedicalHistory) {
    const user = req.user as any;
    return this.patientMedicalHistoryService.create(user.tenantId, patientId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('patient:update')
  async update(@Req() req: Request, @Param('patientId') patientId: string, @Param('id') id: string, @Body() body: UpdatePatientMedicalHistory) {
    const user = req.user as any;
    return this.patientMedicalHistoryService.update(user.tenantId, patientId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('patient:update')
  async remove(@Req() req: Request, @Param('patientId') patientId: string, @Param('id') id: string) {
    const user = req.user as any;
    return this.patientMedicalHistoryService.remove(user.tenantId, patientId, user.id, id);
  }
}
