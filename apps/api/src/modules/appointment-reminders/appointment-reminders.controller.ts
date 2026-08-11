import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put } from '@nestjs/common';
import { Request } from 'express';
import { AppointmentRemindersService } from './appointment-reminders.service';
import type { CreateAppointmentReminder, UpdateAppointmentReminder } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('appointment-reminders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AppointmentRemindersController {
  constructor(private readonly appointmentRemindersService: AppointmentRemindersService) {}

  @Get()
  @RequirePermissions('communication:read')
  async findAll(@Req() req: Request, @Query('appointmentId') appointmentId?: string) {
    const user = req.user as any;
    return this.appointmentRemindersService.findAll(user.tenantId, appointmentId);
  }

  @Get(':id')
  @RequirePermissions('communication:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.appointmentRemindersService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('communication:manage')
  async create(@Req() req: Request, @Body() body: CreateAppointmentReminder) {
    const user = req.user as any;
    return this.appointmentRemindersService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('communication:manage')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateAppointmentReminder) {
    const user = req.user as any;
    return this.appointmentRemindersService.update(user.tenantId, user.id, id, body);
  }
}
