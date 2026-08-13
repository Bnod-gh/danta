import { Controller, Get, Post, Body, Param, UseGuards, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PatientDocumentsService } from './patient-documents.service';
import type { CreatePatientDocument, UpdatePatientDocument } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('patients/:patientId/documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientDocumentsController {
  constructor(private readonly patientDocumentsService: PatientDocumentsService) {}

  @Get()
  @RequirePermissions('patient:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string) {
    return this.patientDocumentsService.findAll(user.tenantId, patientId);
  }

  @Post()
  @RequirePermissions('patient:update')
  async create(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Body() body: CreatePatientDocument) {
    return this.patientDocumentsService.create(user.tenantId, patientId, user.id, body);
  }

  @Get(':id')
  @RequirePermissions('patient:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Param('id') id: string) {
    return this.patientDocumentsService.findOne(user.tenantId, patientId, id);
  }

  @Put(':id')
  @RequirePermissions('patient:update')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Param('id') id: string, @Body() body: UpdatePatientDocument) {
    return this.patientDocumentsService.update(user.tenantId, patientId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('patient:update')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Param('id') id: string) {
    return this.patientDocumentsService.remove(user.tenantId, patientId, user.id, id);
  }
}
