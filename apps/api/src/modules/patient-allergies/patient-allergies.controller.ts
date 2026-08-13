import { Controller, Get, Post, Body, Param, UseGuards, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
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
  async findAll(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string) {
    return this.patientAllergiesService.findAll(user.tenantId, patientId);
  }

  @Post()
  @RequirePermissions('patient:update')
  async create(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Body() body: CreatePatientAllergy) {
    return this.patientAllergiesService.create(user.tenantId, patientId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('patient:update')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Param('id') id: string, @Body() body: UpdatePatientAllergy) {
    return this.patientAllergiesService.update(user.tenantId, patientId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('patient:update')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Param('id') id: string) {
    return this.patientAllergiesService.remove(user.tenantId, patientId, user.id, id);
  }
}
