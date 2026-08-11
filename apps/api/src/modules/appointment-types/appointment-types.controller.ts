import { Controller, Get, Post, Body, Param, UseGuards, Req, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
import { AppointmentTypesService } from './appointment-types.service';
import type { CreateAppointmentType, UpdateAppointmentType } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('appointment-types')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AppointmentTypesController {
  constructor(private readonly appointmentTypesService: AppointmentTypesService) {}

  @Get()
  @RequirePermissions('calendar:read')
  async findAll(@Req() req: Request) {
    const user = req.user as any;
    return this.appointmentTypesService.findAll(user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('calendar:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.appointmentTypesService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('calendar:create')
  async create(@Req() req: Request, @Body() body: CreateAppointmentType) {
    const user = req.user as any;
    return this.appointmentTypesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('calendar:update')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateAppointmentType) {
    const user = req.user as any;
    return this.appointmentTypesService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('calendar:delete')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.appointmentTypesService.remove(user.tenantId, user.id, id);
  }
}
