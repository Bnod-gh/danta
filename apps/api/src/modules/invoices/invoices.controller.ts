import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { InvoicesService } from './invoices.service';
import type { CreateInvoice, UpdateInvoice, CreateInvoiceItem, UpdateInvoiceItem } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('invoices')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @RequirePermissions('billing:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('patientId') patientId?: string, @Query('status') status?: string, @Query('skip', ParseIntPipe) skip?: number, @Query('take', ParseIntPipe) take?: number) {
    return this.invoicesService.findAll(user.tenantId, patientId, status, skip, take);
  }

  @Get(':id')
  @RequirePermissions('billing:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.invoicesService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('billing:create')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateInvoice) {
    return this.invoicesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('billing:create')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateInvoice) {
    return this.invoicesService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('billing:create')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.invoicesService.remove(user.tenantId, user.id, id);
  }

  @Post(':id/items')
  @RequirePermissions('billing:create')
  async addItem(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: CreateInvoiceItem) {
    return this.invoicesService.addItem(user.tenantId, user.id, id, body);
  }

  @Put('items/:itemId')
  @RequirePermissions('billing:create')
  async updateItem(@CurrentUser() user: AuthenticatedUser, @Param('itemId') itemId: string, @Body() body: UpdateInvoiceItem) {
    return this.invoicesService.updateItem(user.tenantId, user.id, itemId, body);
  }

  @Delete('items/:itemId')
  @RequirePermissions('billing:create')
  async removeItem(@CurrentUser() user: AuthenticatedUser, @Param('itemId') itemId: string) {
    return this.invoicesService.removeItem(user.tenantId, user.id, itemId);
  }
}
