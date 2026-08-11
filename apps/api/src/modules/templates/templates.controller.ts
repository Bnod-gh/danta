import { Controller, Get, Post, Body, Param, UseGuards, Req, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
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
  async findAll(@Req() req: Request) {
    const user = req.user as any;
    return this.templatesService.findAll(user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('clinical:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.templatesService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('clinical:create')
  async create(@Req() req: Request, @Body() body: CreateTemplate) {
    const user = req.user as any;
    return this.templatesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('clinical:amend')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateTemplate) {
    const user = req.user as any;
    return this.templatesService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('clinical:amend')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.templatesService.remove(user.tenantId, user.id, id);
  }
}
