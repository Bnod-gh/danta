import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { Request } from 'express';
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
  async findAll(@Req() req: Request, @Query() query: AppointmentQuery, @Query('skip', ParseIntPipe) skip?: number, @Query('take', ParseIntPipe) take?: number) {
    const user = req.user as any;
    return this.appointmentsService.findAll(user.tenantId, query, skip, take);
  }

  @Get(':id')
  @RequirePermissions('calendar:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.appointmentsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('calendar:create')
  async create(@Req() req: Request, @Body() body: CreateAppointment) {
    const user = req.user as any;
    return this.appointmentsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('calendar:update')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateAppointment) {
    const user = req.user as any;
    return this.appointmentsService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('calendar:delete')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.appointmentsService.remove(user.tenantId, user.id, id);
  }
}
