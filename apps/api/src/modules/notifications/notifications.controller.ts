import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, ParseIntPipe } from '@nestjs/common';
import { Request } from 'express';
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
  async findAll(@Req() req: Request, @Query() query: NotificationQuery, @Query('skip', ParseIntPipe) skip?: number, @Query('take', ParseIntPipe) take?: number) {
    const user = req.user as any;
    return this.notificationsService.findAll(user.tenantId, query, skip, take);
  }

  @Get(':id')
  @RequirePermissions('communication:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.notificationsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('communication:manage')
  async create(@Req() req: Request, @Body() body: CreateNotification) {
    const user = req.user as any;
    return this.notificationsService.create(user.tenantId, user.id, body);
  }

  @Put(':id/read')
  @RequirePermissions('communication:read')
  async markAsRead(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.notificationsService.markAsRead(user.tenantId, id);
  }
}
