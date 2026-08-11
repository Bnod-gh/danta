import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, ParseIntPipe } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import type { CreatePayment, UpdatePayment, CreatePaymentAllocation } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePermissions('payment:process')
  async findAll(@Req() req: Request, @Query('patientId') patientId?: string, @Query('skip', ParseIntPipe) skip?: number, @Query('take', ParseIntPipe) take?: number) {
    const user = req.user as any;
    return this.paymentsService.findAll(user.tenantId, patientId, skip, take);
  }

  @Get(':id')
  @RequirePermissions('payment:process')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.paymentsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('payment:process')
  async create(@Req() req: Request, @Body() body: CreatePayment) {
    const user = req.user as any;
    return this.paymentsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('payment:process')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdatePayment) {
    const user = req.user as any;
    return this.paymentsService.update(user.tenantId, user.id, id, body);
  }

  @Post('allocate')
  @RequirePermissions('payment:process')
  async allocate(@Req() req: Request, @Body() body: CreatePaymentAllocation) {
    const user = req.user as any;
    return this.paymentsService.allocate(user.tenantId, user.id, body);
  }

  @Get('allocations/:paymentId')
  @RequirePermissions('payment:process')
  async getByPayment(@Req() req: Request, @Param('paymentId') paymentId: string) {
    const user = req.user as any;
    return this.paymentsService.findByPayment(user.tenantId, paymentId);
  }
}
