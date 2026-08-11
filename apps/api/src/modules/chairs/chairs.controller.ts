import { Controller, Get, Post, Body, Param, UseGuards, Req, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
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
  async findAll(@Req() req: Request) {
    const user = req.user as any;
    return this.chairsService.findAll(user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('calendar:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.chairsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('calendar:create')
  async create(@Req() req: Request, @Body() body: CreateChair) {
    const user = req.user as any;
    return this.chairsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('calendar:update')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateChair) {
    const user = req.user as any;
    return this.chairsService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('calendar:delete')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.chairsService.remove(user.tenantId, user.id, id);
  }
}
