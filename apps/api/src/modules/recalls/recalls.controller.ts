import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RecallsService } from './recalls.service';
import type { CreateRecall, UpdateRecall, RecallQuery, RecallType } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('recalls')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RecallsController {
  constructor(private readonly recallsService: RecallsService) {}

  @Get()
  @RequirePermissions('communication:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: RecallQuery, @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number, @Query('take', new DefaultValuePipe(50), ParseIntPipe) take?: number) {
    return this.recallsService.findAll(user.tenantId, query, skip, take);
  }

  @Get('config')
  @RequirePermissions('communication:read')
  async getConfigs(@CurrentUser() user: AuthenticatedUser) {
    return this.recallsService.getConfigs(user.tenantId);
  }

  @Put('config/:type')
  @RequirePermissions('communication:manage')
  async updateConfig(@CurrentUser() user: AuthenticatedUser, @Param('type') type: string, @Body() body: { intervalDays?: number; channel?: 'sms' | 'email' | 'both'; isActive?: boolean }) {
    return this.recallsService.updateConfig(user.tenantId, user.id, type as RecallType, body);
  }

  @Get(':id')
  @RequirePermissions('communication:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.recallsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('communication:manage')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateRecall) {
    return this.recallsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('communication:manage')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateRecall) {
    return this.recallsService.update(user.tenantId, user.id, id, body);
  }
}
