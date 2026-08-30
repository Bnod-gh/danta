import { Controller, Get, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PatientGuardianService } from './patient-guardian.service';
import { UpsertPatientGuardian } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('patients/:patientId/guardian')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientGuardianController {
  constructor(private readonly guardianService: PatientGuardianService) {}

  @Get()
  @RequirePermissions('patient:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string) {
    return this.guardianService.findOne(user.tenantId, patientId);
  }

  @Put()
  @RequirePermissions('patient:update')
  async upsert(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Body() body: UpsertPatientGuardian) {
    return this.guardianService.upsert(user.tenantId, user.id, patientId, body);
  }

  @Delete()
  @RequirePermissions('patient:update')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string) {
    return this.guardianService.remove(user.tenantId, user.id, patientId);
  }
}
