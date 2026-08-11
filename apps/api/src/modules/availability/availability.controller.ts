import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
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
  async findAll(@Req() req: Request, @Query('providerId') providerId?: string) {
    const user = req.user as any;
    return this.availabilityService.findAll(user.tenantId, providerId);
  }

  @Get(':id')
  @RequirePermissions('calendar:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.availabilityService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('calendar:create')
  async create(@Req() req: Request, @Body() body: CreateAvailability) {
    const user = req.user as any;
    return this.availabilityService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('calendar:update')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateAvailability) {
    const user = req.user as any;
    return this.availabilityService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('calendar:delete')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.availabilityService.remove(user.tenantId, user.id, id);
  }
}
