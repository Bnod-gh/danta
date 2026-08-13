import { Controller, Get, Post, Body, Param, UseGuards, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
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
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.providersService.findAll(user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('calendar:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.providersService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('calendar:create')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateProvider) {
    return this.providersService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('calendar:update')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateProvider) {
    return this.providersService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('calendar:delete')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.providersService.remove(user.tenantId, user.id, id);
  }
}
