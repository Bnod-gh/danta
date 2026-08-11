import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put } from '@nestjs/common';
import { Request } from 'express';
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
  async findAll(@Req() req: Request, @Query('paymentId') paymentId?: string) {
    const user = req.user as any;
    return this.refundsService.findAll(user.tenantId, paymentId);
  }

  @Get(':id')
  @RequirePermissions('billing:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.refundsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('payment:process')
  async create(@Req() req: Request, @Body() body: CreateRefund) {
    const user = req.user as any;
    return this.refundsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('payment:process')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateRefund) {
    const user = req.user as any;
    return this.refundsService.update(user.tenantId, user.id, id, body);
  }

  @Post('credit-notes')
  @RequirePermissions('billing:create')
  async createCreditNote(@Req() req: Request, @Body() body: CreateCreditNote) {
    const user = req.user as any;
    return this.refundsService.createCreditNote(user.tenantId, user.id, body);
  }

  @Get('credit-notes/:id')
  @RequirePermissions('billing:read')
  async getCreditNote(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.refundsService.getCreditNote(user.tenantId, id);
  }
}
