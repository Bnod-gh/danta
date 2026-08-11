import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
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
  async findAll(@Req() req: Request, @Query('patientId') patientId?: string) {
    const user = req.user as any;
    return this.treatmentHistoryService.findAll(user.tenantId, patientId);
  }

  @Get(':id')
  @RequirePermissions('clinical:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.treatmentHistoryService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('clinical:create')
  async create(@Req() req: Request, @Body() body: CreateTreatmentHistory) {
    const user = req.user as any;
    return this.treatmentHistoryService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('clinical:amend')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateTreatmentHistory) {
    const user = req.user as any;
    return this.treatmentHistoryService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('clinical:amend')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.treatmentHistoryService.remove(user.tenantId, user.id, id);
  }
}
