import { Controller, Get, Post, Body, Param, UseGuards, Req, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
import { ProvidersService } from './providers.service';
import type { CreateProvider, UpdateProvider } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('providers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  @RequirePermissions('calendar:read')
  async findAll(@Req() req: Request) {
    const user = req.user as any;
    return this.providersService.findAll(user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('calendar:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.providersService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('calendar:create')
  async create(@Req() req: Request, @Body() body: CreateProvider) {
    const user = req.user as any;
    return this.providersService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('calendar:update')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateProvider) {
    const user = req.user as any;
    return this.providersService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('calendar:delete')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.providersService.remove(user.tenantId, user.id, id);
  }
}
