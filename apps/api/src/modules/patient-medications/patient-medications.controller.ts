import { Controller, Get, Post, Body, Param, UseGuards, Req, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
import { PatientMedicationsService } from './patient-medications.service';
import type { CreatePatientMedication, UpdatePatientMedication } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('patients/:patientId/medications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientMedicationsController {
  constructor(private readonly patientMedicationsService: PatientMedicationsService) {}

  @Get()
  @RequirePermissions('patient:read')
  async findAll(@Req() req: Request, @Param('patientId') patientId: string) {
    const user = req.user as any;
    return this.patientMedicationsService.findAll(user.tenantId, patientId);
  }

  @Post()
  @RequirePermissions('patient:update')
  async create(@Req() req: Request, @Param('patientId') patientId: string, @Body() body: CreatePatientMedication) {
    const user = req.user as any;
    return this.patientMedicationsService.create(user.tenantId, patientId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('patient:update')
  async update(@Req() req: Request, @Param('patientId') patientId: string, @Param('id') id: string, @Body() body: UpdatePatientMedication) {
    const user = req.user as any;
    return this.patientMedicationsService.update(user.tenantId, patientId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('patient:update')
  async remove(@Req() req: Request, @Param('patientId') patientId: string, @Param('id') id: string) {
    const user = req.user as any;
    return this.patientMedicationsService.remove(user.tenantId, patientId, user.id, id);
  }
}
