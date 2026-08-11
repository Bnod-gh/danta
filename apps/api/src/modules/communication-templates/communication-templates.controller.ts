import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
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
  async findAll(@Req() req: Request, @Query('category') category?: string) {
    const user = req.user as any;
    return this.communicationTemplatesService.findAll(user.tenantId, category);
  }

  @Get(':id')
  @RequirePermissions('communication:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.communicationTemplatesService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('communication:manage')
  async create(@Req() req: Request, @Body() body: CreateCommunicationTemplate) {
    const user = req.user as any;
    return this.communicationTemplatesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('communication:manage')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateCommunicationTemplate) {
    const user = req.user as any;
    return this.communicationTemplatesService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('communication:manage')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.communicationTemplatesService.remove(user.tenantId, user.id, id);
  }
}
