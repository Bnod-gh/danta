import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { DentalChartsService } from './dental-charts.service';
import type { CreateDentalChart, UpdateDentalChart } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('dental-charts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DentalChartsController {
  constructor(private readonly dentalChartsService: DentalChartsService) {}

  @Get()
  @RequirePermissions('dental_chart:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('patientId') patientId?: string) {
    return this.dentalChartsService.findAll(user.tenantId, patientId);
  }

  @Get(':id')
  @RequirePermissions('dental_chart:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.dentalChartsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('dental_chart:update')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateDentalChart) {
    return this.dentalChartsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('dental_chart:update')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateDentalChart) {
    return this.dentalChartsService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('dental_chart:update')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.dentalChartsService.remove(user.tenantId, user.id, id);
  }
}
