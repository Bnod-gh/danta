import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { Request } from 'express';
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
  async findAll(@Req() req: Request, @Query('patientId') patientId?: string, @Query('status') status?: string, @Query('skip', ParseIntPipe) skip?: number, @Query('take', ParseIntPipe) take?: number) {
    const user = req.user as any;
    return this.invoicesService.findAll(user.tenantId, patientId, status, skip, take);
  }

  @Get(':id')
  @RequirePermissions('billing:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.invoicesService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('billing:create')
  async create(@Req() req: Request, @Body() body: CreateInvoice) {
    const user = req.user as any;
    return this.invoicesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('billing:create')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateInvoice) {
    const user = req.user as any;
    return this.invoicesService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('billing:create')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.invoicesService.remove(user.tenantId, user.id, id);
  }

  @Post(':id/items')
  @RequirePermissions('billing:create')
  async addItem(@Req() req: Request, @Param('id') id: string, @Body() body: CreateInvoiceItem) {
    const user = req.user as any;
    return this.invoicesService.addItem(user.tenantId, user.id, id, body);
  }

  @Put('items/:itemId')
  @RequirePermissions('billing:create')
  async updateItem(@Req() req: Request, @Param('itemId') itemId: string, @Body() body: UpdateInvoiceItem) {
    const user = req.user as any;
    return this.invoicesService.updateItem(user.tenantId, user.id, itemId, body);
  }

  @Delete('items/:itemId')
  @RequirePermissions('billing:create')
  async removeItem(@Req() req: Request, @Param('itemId') itemId: string) {
    const user = req.user as any;
    return this.invoicesService.removeItem(user.tenantId, user.id, itemId);
  }
}
