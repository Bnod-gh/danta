import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeysService } from './api-keys.service';
import type { ApiKeyCreate } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('api-keys')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @RequirePermissions('settings:manage')
  async create(@Req() req: Request, @Body() body: ApiKeyCreate) {
    const user = req.user as any;
    return this.apiKeysService.create(user.tenantId, user.id, body);
  }

  @Get()
  @RequirePermissions('settings:manage')
  async findAll(@Req() req: Request) {
    const user = req.user as any;
    return this.apiKeysService.findAll(user.tenantId);
  }

  @Post(':id/revoke')
  @RequirePermissions('settings:manage')
  async revoke(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.apiKeysService.revoke(user.tenantId, id, user.id);
  }
}
