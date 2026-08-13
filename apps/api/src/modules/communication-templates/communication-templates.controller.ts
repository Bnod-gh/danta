import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CommunicationTemplatesService } from './communication-templates.service';
import type { CreateCommunicationTemplate, UpdateCommunicationTemplate } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('communication-templates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CommunicationTemplatesController {
  constructor(private readonly communicationTemplatesService: CommunicationTemplatesService) {}

  @Get()
  @RequirePermissions('communication:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('category') category?: string) {
    return this.communicationTemplatesService.findAll(user.tenantId, category);
  }

  @Get(':id')
  @RequirePermissions('communication:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.communicationTemplatesService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('communication:manage')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateCommunicationTemplate) {
    return this.communicationTemplatesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('communication:manage')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateCommunicationTemplate) {
    return this.communicationTemplatesService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('communication:manage')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.communicationTemplatesService.remove(user.tenantId, user.id, id);
  }
}
