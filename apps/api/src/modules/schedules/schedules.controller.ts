import { Body, Controller, Delete, Get, Param, Put, Query, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { SchedulesService } from './schedules.service';
import type {
  CreateProviderShift,
  UpdateProviderShift,
  CreateScheduleOverride,
  UpdateScheduleOverride,
} from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('schedules')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('shifts')
  @RequirePermissions('schedule:read')
  async listShifts(@CurrentUser() user: AuthenticatedUser, @Query('providerId') providerId?: string) {
    return this.schedulesService.listShifts(user.tenantId, providerId);
  }

  @Post('shifts')
  @RequirePermissions('schedule:create')
  async createShift(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateProviderShift) {
    return this.schedulesService.createShift(user.tenantId, user.id, body);
  }

  @Put('shifts/:id')
  @RequirePermissions('schedule:update')
  async updateShift(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateProviderShift) {
    return this.schedulesService.updateShift(user.tenantId, user.id, id, body);
  }

  @Delete('shifts/:id')
  @RequirePermissions('schedule:delete')
  async removeShift(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.schedulesService.removeShift(user.tenantId, user.id, id);
  }

  @Get('overrides')
  @RequirePermissions('schedule:read')
  async listOverrides(
    @CurrentUser() user: AuthenticatedUser,
    @Query('providerId') providerId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.schedulesService.listOverrides(user.tenantId, providerId, from, to);
  }

  @Post('overrides')
  @RequirePermissions('schedule:create')
  async createOverride(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateScheduleOverride) {
    return this.schedulesService.createOverride(user.tenantId, user.id, body);
  }

  @Put('overrides/:id')
  @RequirePermissions('schedule:update')
  async updateOverride(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateScheduleOverride) {
    return this.schedulesService.updateOverride(user.tenantId, user.id, id, body);
  }

  @Delete('overrides/:id')
  @RequirePermissions('schedule:delete')
  async removeOverride(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.schedulesService.removeOverride(user.tenantId, user.id, id);
  }

  @Get('free-slots')
  @RequirePermissions('schedule:read')
  async getFreeSlots(
    @CurrentUser() user: AuthenticatedUser,
    @Query('providerId') providerId: string,
    @Query('date') date: string,
    @Query('durationMin') durationMin?: string,
    @Query('stepMin') stepMin?: string,
  ) {
    const parsedDate = new Date(`${date}T00:00:00`);
    return this.schedulesService.getFreeSlots(user.tenantId, {
      providerId,
      date: parsedDate,
      durationMin: durationMin ? Number(durationMin) : 30,
      stepMin: stepMin ? Number(stepMin) : 15,
    });
  }
}
