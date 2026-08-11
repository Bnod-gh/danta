import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
import { PeriodontalRecordsService } from './periodontal-records.service';
import type { CreatePeriodontalRecord, UpdatePeriodontalRecord } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('periodontal-records')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PeriodontalRecordsController {
  constructor(private readonly periodontalRecordsService: PeriodontalRecordsService) {}

  @Get()
  @RequirePermissions('clinical:read')
  async findAll(@Req() req: Request, @Query('patientId') patientId?: string) {
    const user = req.user as any;
    return this.periodontalRecordsService.findAll(user.tenantId, patientId);
  }

  @Get(':id')
  @RequirePermissions('clinical:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.periodontalRecordsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('clinical:create')
  async create(@Req() req: Request, @Body() body: CreatePeriodontalRecord) {
    const user = req.user as any;
    return this.periodontalRecordsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('clinical:amend')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdatePeriodontalRecord) {
    const user = req.user as any;
    return this.periodontalRecordsService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('clinical:amend')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.periodontalRecordsService.remove(user.tenantId, user.id, id);
  }
}
