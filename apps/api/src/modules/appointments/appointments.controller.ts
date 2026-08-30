import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AppointmentsService } from './appointments.service';
import type { CreateAppointment, UpdateAppointment, AppointmentQuery } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('appointments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @RequirePermissions('calendar:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: AppointmentQuery, @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number, @Query('take', new DefaultValuePipe(50), ParseIntPipe) take?: number) {
    return this.appointmentsService.findAll(user.tenantId, query, skip, take);
  }

  @Get(':id')
  @RequirePermissions('calendar:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.appointmentsService.findOne(user.tenantId, id);
  }

  @Get('schedule/day')
  @RequirePermissions('calendar:read')
  async getDaySchedule(@CurrentUser() user: AuthenticatedUser, @Query('date') date: string) {
    return this.appointmentsService.getDaySchedule(user.tenantId, date);
  }

  @Post()
  @RequirePermissions('calendar:create')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateAppointment) {
    return this.appointmentsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('calendar:update')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateAppointment) {
    return this.appointmentsService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('calendar:delete')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.appointmentsService.remove(user.tenantId, user.id, id);
  }
}
