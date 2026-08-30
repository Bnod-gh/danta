import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PatientPrivacyService } from './patient-privacy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('patients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientPrivacyController {
  constructor(private readonly patientPrivacyService: PatientPrivacyService) {}

  @Get(':id/access-log')
  @RequirePermissions('patient:read')
  async getAccessLog(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') patientId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    await this.patientPrivacyService.canAccessPatient(user.tenantId, user.id, patientId);
    await this.patientPrivacyService.logPatientAccess(user.tenantId, user.id, patientId, 'view_access_log');

    return this.patientPrivacyService.findAccessLogs(user.tenantId, patientId, limit, offset);
  }
}
