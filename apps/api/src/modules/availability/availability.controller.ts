import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AvailabilityService } from './availability.service';
import type { CreateAvailability, UpdateAvailability } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('availability')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  @RequirePermissions('calendar:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('providerId') providerId?: string) {
    return this.availabilityService.findAll(user.tenantId, providerId);
  }

  @Get(':id')
  @RequirePermissions('calendar:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.availabilityService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('calendar:create')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateAvailability) {
    return this.availabilityService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('calendar:update')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateAvailability) {
    return this.availabilityService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('calendar:delete')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.availabilityService.remove(user.tenantId, user.id, id);
  }
}
