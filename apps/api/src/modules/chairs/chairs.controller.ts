import { Controller, Get, Post, Body, Param, UseGuards, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ChairsService } from './chairs.service';
import type { CreateChair, UpdateChair } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('chairs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChairsController {
  constructor(private readonly chairsService: ChairsService) {}

  @Get()
  @RequirePermissions('calendar:read')
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.chairsService.findAll(user.tenantId);
  }

  @Get('live')
  @RequirePermissions('calendar:read')
  async findLive(@CurrentUser() user: AuthenticatedUser) {
    return this.chairsService.findLive(user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('calendar:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.chairsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('calendar:create')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateChair) {
    return this.chairsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('calendar:update')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateChair) {
    return this.chairsService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('calendar:delete')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.chairsService.remove(user.tenantId, user.id, id);
  }
}
