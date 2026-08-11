import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, ParseIntPipe } from '@nestjs/common';
import { Request } from 'express';
import { RecallsService } from './recalls.service';
import type { CreateRecall, UpdateRecall, RecallQuery } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('recalls')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RecallsController {
  constructor(private readonly recallsService: RecallsService) {}

  @Get()
  @RequirePermissions('communication:read')
  async findAll(@Req() req: Request, @Query() query: RecallQuery, @Query('skip', ParseIntPipe) skip?: number, @Query('take', ParseIntPipe) take?: number) {
    const user = req.user as any;
    return this.recallsService.findAll(user.tenantId, query, skip, take);
  }

  @Get(':id')
  @RequirePermissions('communication:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.recallsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('communication:manage')
  async create(@Req() req: Request, @Body() body: CreateRecall) {
    const user = req.user as any;
    return this.recallsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('communication:manage')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateRecall) {
    const user = req.user as any;
    return this.recallsService.update(user.tenantId, user.id, id, body);
  }
}
