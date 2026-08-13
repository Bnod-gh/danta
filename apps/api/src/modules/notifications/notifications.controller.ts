import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, ParseIntPipe } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import type { CreateNotification, NotificationQuery } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @RequirePermissions('communication:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: NotificationQuery, @Query('skip', ParseIntPipe) skip?: number, @Query('take', ParseIntPipe) take?: number) {
    return this.notificationsService.findAll(user.tenantId, query, skip, take);
  }

  @Get(':id')
  @RequirePermissions('communication:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notificationsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('communication:manage')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateNotification) {
    return this.notificationsService.create(user.tenantId, user.id, body);
  }

  @Put(':id/read')
  @RequirePermissions('communication:read')
  async markAsRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.tenantId, id);
  }
}
