import { Controller, Get, Post, Body, Param, UseGuards, Query, Put } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
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
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('patientId') patientId?: string) {
    return this.communicationPreferencesService.findAll(user.tenantId, patientId);
  }

  @Get(':id')
  @RequirePermissions('communication:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.communicationPreferencesService.findOne(user.tenantId, id);
  }

  @Get('by-patient/:patientId')
  @RequirePermissions('communication:read')
  async findByPatient(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string) {
    return this.communicationPreferencesService.findByPatient(user.tenantId, patientId);
  }

  @Post()
  @RequirePermissions('communication:manage')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateCommunicationPreference) {
    return this.communicationPreferencesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('communication:manage')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateCommunicationPreference) {
    return this.communicationPreferencesService.update(user.tenantId, user.id, id, body);
  }
}
