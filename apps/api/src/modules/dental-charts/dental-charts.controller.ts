import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
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
  async findAll(@Req() req: Request, @Query('patientId') patientId?: string) {
    const user = req.user as any;
    return this.dentalChartsService.findAll(user.tenantId, patientId);
  }

  @Get(':id')
  @RequirePermissions('dental_chart:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.dentalChartsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('dental_chart:update')
  async create(@Req() req: Request, @Body() body: CreateDentalChart) {
    const user = req.user as any;
    return this.dentalChartsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('dental_chart:update')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateDentalChart) {
    const user = req.user as any;
    return this.dentalChartsService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('dental_chart:update')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.dentalChartsService.remove(user.tenantId, user.id, id);
  }
}
