import { Controller, Get, Post, Body, Param, UseGuards, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PatientAlertsService } from './patient-alerts.service';
import type { CreatePatientAlert, UpdatePatientAlert } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('patients/:patientId/alerts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientAlertsController {
  constructor(private readonly patientAlertsService: PatientAlertsService) {}

  @Get()
  @RequirePermissions('patient:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string) {
    return this.patientAlertsService.findAll(user.tenantId, patientId);
  }

  @Post()
  @RequirePermissions('patient:update')
  async create(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Body() body: CreatePatientAlert) {
    return this.patientAlertsService.create(user.tenantId, patientId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('patient:update')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Param('id') id: string, @Body() body: UpdatePatientAlert) {
    return this.patientAlertsService.update(user.tenantId, patientId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('patient:update')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Param('id') id: string) {
    return this.patientAlertsService.remove(user.tenantId, patientId, user.id, id);
  }
}
