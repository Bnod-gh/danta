import { Controller, Get, Post, Body, Param, UseGuards, Query, Put } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
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
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('appointmentId') appointmentId?: string) {
    return this.appointmentRemindersService.findAll(user.tenantId, appointmentId);
  }

  @Get(':id')
  @RequirePermissions('communication:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.appointmentRemindersService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('communication:manage')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateAppointmentReminder) {
    return this.appointmentRemindersService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('communication:manage')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateAppointmentReminder) {
    return this.appointmentRemindersService.update(user.tenantId, user.id, id, body);
  }
}
