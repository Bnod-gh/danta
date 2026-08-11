import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
import { FeesService } from './fees.service';
import type { CreateFeeSchedule, UpdateFeeSchedule } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('fees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Get()
  @RequirePermissions('billing:read')
  async findAll(@Req() req: Request, @Query('serviceId') serviceId?: string) {
    const user = req.user as any;
    return this.feesService.findAll(user.tenantId, serviceId);
  }

  @Get(':id')
  @RequirePermissions('billing:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.feesService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('billing:create')
  async create(@Req() req: Request, @Body() body: CreateFeeSchedule) {
    const user = req.user as any;
    return this.feesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('billing:create')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateFeeSchedule) {
    const user = req.user as any;
    return this.feesService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('billing:create')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.feesService.remove(user.tenantId, user.id, id);
  }
}
