import { Controller, Get, Post, Body, Param, UseGuards, Req, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
import { PatientContactsService } from './patient-contacts.service';
import type { CreatePatientContact, UpdatePatientContact } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('patients/:patientId/contacts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientContactsController {
  constructor(private readonly patientContactsService: PatientContactsService) {}

  @Get()
  @RequirePermissions('patient:read')
  async findAll(@Req() req: Request, @Param('patientId') patientId: string) {
    const user = req.user as any;
    return this.patientContactsService.findAll(user.tenantId, patientId);
  }

  @Post()
  @RequirePermissions('patient:update')
  async create(@Req() req: Request, @Param('patientId') patientId: string, @Body() body: CreatePatientContact) {
    const user = req.user as any;
    return this.patientContactsService.create(user.tenantId, patientId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('patient:update')
  async update(@Req() req: Request, @Param('patientId') patientId: string, @Param('id') id: string, @Body() body: UpdatePatientContact) {
    const user = req.user as any;
    return this.patientContactsService.update(user.tenantId, patientId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('patient:update')
  async remove(@Req() req: Request, @Param('patientId') patientId: string, @Param('id') id: string) {
    const user = req.user as any;
    return this.patientContactsService.remove(user.tenantId, patientId, user.id, id);
  }
}
