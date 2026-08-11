import { Controller, Get, Post, Body, Param, UseGuards, Req, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
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
  async findAll(@Req() req: Request, @Param('patientId') patientId: string) {
    const user = req.user as any;
    return this.patientDocumentsService.findAll(user.tenantId, patientId);
  }

  @Post()
  @RequirePermissions('patient:update')
  async create(@Req() req: Request, @Param('patientId') patientId: string, @Body() body: CreatePatientDocument) {
    const user = req.user as any;
    return this.patientDocumentsService.create(user.tenantId, patientId, user.id, body);
  }

  @Get(':id')
  @RequirePermissions('patient:read')
  async findOne(@Req() req: Request, @Param('patientId') patientId: string, @Param('id') id: string) {
    const user = req.user as any;
    return this.patientDocumentsService.findOne(user.tenantId, patientId, id);
  }

  @Put(':id')
  @RequirePermissions('patient:update')
  async update(@Req() req: Request, @Param('patientId') patientId: string, @Param('id') id: string, @Body() body: UpdatePatientDocument) {
    const user = req.user as any;
    return this.patientDocumentsService.update(user.tenantId, patientId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('patient:update')
  async remove(@Req() req: Request, @Param('patientId') patientId: string, @Param('id') id: string) {
    const user = req.user as any;
    return this.patientDocumentsService.remove(user.tenantId, patientId, user.id, id);
  }
}
