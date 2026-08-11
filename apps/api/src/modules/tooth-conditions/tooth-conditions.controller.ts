import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
import { ToothConditionsService } from './tooth-conditions.service';
import type { CreateToothCondition, UpdateToothCondition } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('tooth-conditions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ToothConditionsController {
  constructor(private readonly toothConditionsService: ToothConditionsService) {}

  @Get()
  @RequirePermissions('dental_chart:read')
  async findAll(@Req() req: Request, @Query('dentalChartId') dentalChartId?: string) {
    const user = req.user as any;
    return this.toothConditionsService.findAll(user.tenantId, dentalChartId);
  }

  @Get(':id')
  @RequirePermissions('dental_chart:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.toothConditionsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('dental_chart:update')
  async create(@Req() req: Request, @Body() body: CreateToothCondition) {
    const user = req.user as any;
    return this.toothConditionsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('dental_chart:update')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateToothCondition) {
    const user = req.user as any;
    return this.toothConditionsService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('dental_chart:update')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.toothConditionsService.remove(user.tenantId, user.id, id);
  }
}
