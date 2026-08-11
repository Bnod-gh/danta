import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
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
  async findAll(@Req() req: Request, @Query() query: PatientFormQuery) {
    const user = req.user as any;
    return this.patientFormsService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('patient:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.patientFormsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('patient:create')
  async create(@Req() req: Request, @Body() body: CreatePatientForm) {
    const user = req.user as any;
    return this.patientFormsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('patient:update')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdatePatientForm) {
    const user = req.user as any;
    return this.patientFormsService.update(user.tenantId, id, body);
  }

  @Delete(':id')
  @RequirePermissions('patient:delete')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.patientFormsService.remove(user.tenantId, id);
  }
}
