import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
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
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('patientId') patientId?: string, @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number, @Query('take', new DefaultValuePipe(50), ParseIntPipe) take?: number) {
    return this.paymentsService.findAll(user.tenantId, patientId, skip, take);
  }

  @Get(':id')
  @RequirePermissions('payment:process')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.paymentsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('payment:process')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreatePayment) {
    return this.paymentsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('payment:process')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdatePayment) {
    return this.paymentsService.update(user.tenantId, user.id, id, body);
  }

  @Post('allocate')
  @RequirePermissions('payment:process')
  async allocate(@CurrentUser() user: AuthenticatedUser, @Body() body: CreatePaymentAllocation) {
    return this.paymentsService.allocate(user.tenantId, user.id, body);
  }

  @Get('allocations/:paymentId')
  @RequirePermissions('payment:process')
  async getByPayment(@CurrentUser() user: AuthenticatedUser, @Param('paymentId') paymentId: string) {
    return this.paymentsService.findByPayment(user.tenantId, paymentId);
  }
}
