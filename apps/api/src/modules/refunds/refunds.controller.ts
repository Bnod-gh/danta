import { Controller, Get, Post, Body, Param, UseGuards, Query, Put } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RefundsService } from './refunds.service';
import type { CreateRefund, UpdateRefund, CreateCreditNote } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('refunds')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Get()
  @RequirePermissions('billing:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('paymentId') paymentId?: string) {
    return this.refundsService.findAll(user.tenantId, paymentId);
  }

  @Get(':id')
  @RequirePermissions('billing:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.refundsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('payment:process')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateRefund) {
    return this.refundsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('payment:process')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateRefund) {
    return this.refundsService.update(user.tenantId, user.id, id, body);
  }

  @Post('credit-notes')
  @RequirePermissions('billing:create')
  async createCreditNote(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateCreditNote) {
    return this.refundsService.createCreditNote(user.tenantId, user.id, body);
  }

  @Get('credit-notes/:id')
  @RequirePermissions('billing:read')
  async getCreditNote(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.refundsService.getCreditNote(user.tenantId, id);
  }
}
