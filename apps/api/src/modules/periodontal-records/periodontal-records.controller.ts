import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
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
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('patientId') patientId?: string) {
    return this.periodontalRecordsService.findAll(user.tenantId, patientId);
  }

  @Get(':id')
  @RequirePermissions('clinical:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.periodontalRecordsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('clinical:create')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreatePeriodontalRecord) {
    return this.periodontalRecordsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('clinical:amend')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdatePeriodontalRecord) {
    return this.periodontalRecordsService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('clinical:amend')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.periodontalRecordsService.remove(user.tenantId, user.id, id);
  }
}
