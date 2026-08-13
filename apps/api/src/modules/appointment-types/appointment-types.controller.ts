import { Controller, Get, Post, Body, Param, UseGuards, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
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
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.appointmentTypesService.findAll(user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('calendar:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.appointmentTypesService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('calendar:create')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateAppointmentType) {
    return this.appointmentTypesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('calendar:update')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateAppointmentType) {
    return this.appointmentTypesService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('calendar:delete')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.appointmentTypesService.remove(user.tenantId, user.id, id);
  }
}
