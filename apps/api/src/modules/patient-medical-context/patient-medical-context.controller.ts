import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PatientMedicalContextService } from './patient-medical-context.service';
import { UpsertMedicalContext } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('patients/:patientId/medical-context')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientMedicalContextController {
  constructor(private readonly patient_medical_contextService: PatientMedicalContextService) {}

  @Get()
  @RequirePermissions('patient:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string) {
    return this.patient_medical_contextService.findOne(user.tenantId, patientId);
  }

  @Put()
  @RequirePermissions('patient:update')
  async upsert(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Body() body: UpsertMedicalContext) {
    return this.patient_medical_contextService.upsert(user.tenantId, patientId, user.id, body);
  }
}
