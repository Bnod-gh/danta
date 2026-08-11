import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put } from '@nestjs/common';
import { Request } from 'express';
import { CommunicationPreferencesService } from './communication-preferences.service';
import type { CreateCommunicationPreference, UpdateCommunicationPreference } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('communication-preferences')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CommunicationPreferencesController {
  constructor(private readonly communicationPreferencesService: CommunicationPreferencesService) {}

  @Get()
  @RequirePermissions('communication:read')
  async findAll(@Req() req: Request, @Query('patientId') patientId?: string) {
    const user = req.user as any;
    return this.communicationPreferencesService.findAll(user.tenantId, patientId);
  }

  @Get(':id')
  @RequirePermissions('communication:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.communicationPreferencesService.findOne(user.tenantId, id);
  }

  @Get('by-patient/:patientId')
  @RequirePermissions('communication:read')
  async findByPatient(@Req() req: Request, @Param('patientId') patientId: string) {
    const user = req.user as any;
    return this.communicationPreferencesService.findByPatient(user.tenantId, patientId);
  }

  @Post()
  @RequirePermissions('communication:manage')
  async create(@Req() req: Request, @Body() body: CreateCommunicationPreference) {
    const user = req.user as any;
    return this.communicationPreferencesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('communication:manage')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateCommunicationPreference) {
    const user = req.user as any;
    return this.communicationPreferencesService.update(user.tenantId, user.id, id, body);
  }
}
