import { Controller, Get, Post, Body, Param, UseGuards, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
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
  async findAll(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string) {
    return this.patientMedicalHistoryService.findAll(user.tenantId, patientId);
  }

  @Post()
  @RequirePermissions('patient:update')
  async create(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Body() body: CreatePatientMedicalHistory) {
    return this.patientMedicalHistoryService.create(user.tenantId, patientId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('patient:update')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Param('id') id: string, @Body() body: UpdatePatientMedicalHistory) {
    return this.patientMedicalHistoryService.update(user.tenantId, patientId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('patient:update')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Param('id') id: string) {
    return this.patientMedicalHistoryService.remove(user.tenantId, patientId, user.id, id);
  }
}
