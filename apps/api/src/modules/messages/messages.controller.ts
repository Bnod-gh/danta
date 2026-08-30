import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
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
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: MessageQuery, @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number, @Query('take', new DefaultValuePipe(50), ParseIntPipe) take?: number) {
    return this.messagesService.findAll(user.tenantId, query, skip, take);
  }

  @Get(':id')
  @RequirePermissions('communication:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.messagesService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('communication:manage')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateMessage) {
    return this.messagesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('communication:manage')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateMessage) {
    return this.messagesService.update(user.tenantId, user.id, id, body);
  }
}
