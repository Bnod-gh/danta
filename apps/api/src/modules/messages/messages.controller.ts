import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, ParseIntPipe } from '@nestjs/common';
import { Request } from 'express';
import { MessagesService } from './messages.service';
import type { CreateMessage, UpdateMessage, MessageQuery } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('messages')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @RequirePermissions('communication:read')
  async findAll(@Req() req: Request, @Query() query: MessageQuery, @Query('skip', ParseIntPipe) skip?: number, @Query('take', ParseIntPipe) take?: number) {
    const user = req.user as any;
    return this.messagesService.findAll(user.tenantId, query, skip, take);
  }

  @Get(':id')
  @RequirePermissions('communication:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.messagesService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('communication:manage')
  async create(@Req() req: Request, @Body() body: CreateMessage) {
    const user = req.user as any;
    return this.messagesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('communication:manage')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateMessage) {
    const user = req.user as any;
    return this.messagesService.update(user.tenantId, user.id, id, body);
  }
}
