import { Controller, Get, Post, Body, Param, UseGuards, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { TemplatesService } from './templates.service';
import type { CreateTemplate, UpdateTemplate } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('templates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @RequirePermissions('clinical:read')
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.templatesService.findAll(user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('clinical:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.templatesService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('clinical:create')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateTemplate) {
    return this.templatesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('clinical:amend')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateTemplate) {
    return this.templatesService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('clinical:amend')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.templatesService.remove(user.tenantId, user.id, id);
  }
}
