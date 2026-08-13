import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { TreatmentHistoryService } from './treatment-history.service';
import type { CreateTreatmentHistory, UpdateTreatmentHistory } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('treatment-history')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TreatmentHistoryController {
  constructor(private readonly treatmentHistoryService: TreatmentHistoryService) {}

  @Get()
  @RequirePermissions('clinical:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('patientId') patientId?: string) {
    return this.treatmentHistoryService.findAll(user.tenantId, patientId);
  }

  @Get(':id')
  @RequirePermissions('clinical:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.treatmentHistoryService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('clinical:create')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateTreatmentHistory) {
    return this.treatmentHistoryService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('clinical:amend')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateTreatmentHistory) {
    return this.treatmentHistoryService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('clinical:amend')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.treatmentHistoryService.remove(user.tenantId, user.id, id);
  }
}
