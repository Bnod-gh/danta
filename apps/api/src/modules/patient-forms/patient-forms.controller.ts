import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PatientFormsService } from './patient-forms.service';
import type { CreatePatientForm, UpdatePatientForm, PatientFormQuery } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('patient-forms')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientFormsController {
  constructor(private readonly patientFormsService: PatientFormsService) {}

  @Get()
  @RequirePermissions('patient:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: PatientFormQuery) {
    return this.patientFormsService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('patient:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.patientFormsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('patient:create')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreatePatientForm) {
    return this.patientFormsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('patient:update')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdatePatientForm) {
    return this.patientFormsService.update(user.tenantId, id, body);
  }

  @Delete(':id')
  @RequirePermissions('patient:delete')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.patientFormsService.remove(user.tenantId, id);
  }
}
