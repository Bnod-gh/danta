import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { WaitlistService } from './waitlist.service';
import type { CreateWaitlist, UpdateWaitlist, WaitlistQuery } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('waitlist')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Get()
  @RequirePermissions('schedule:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: WaitlistQuery) {
    return this.waitlistService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('schedule:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.waitlistService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('schedule:create')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateWaitlist) {
    return this.waitlistService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('schedule:update')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateWaitlist) {
    return this.waitlistService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('schedule:delete')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.waitlistService.remove(user.tenantId, user.id, id);
  }

  @Post(':id/book')
  @RequirePermissions('schedule:create')
  async book(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: {
    patientId: string;
    providerId?: string;
    chairId?: string;
    appointmentTypeId?: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }) {
    return this.waitlistService.bookFromWaitlist(user.tenantId, user.id, id, {
      patientId: body.patientId,
      providerId: body.providerId,
      chairId: body.chairId,
      appointmentTypeId: body.appointmentTypeId,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      notes: body.notes,
    });
  }
}

