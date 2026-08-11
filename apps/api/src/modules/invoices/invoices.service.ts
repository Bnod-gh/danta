import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateInvoice, UpdateInvoice, CreateInvoiceItem, UpdateInvoiceItem } from '@danta/schemas';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, patientId?: string, status?: string, skip?: number, take?: number) {
    const where: any = { tenantId };
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip: skip ?? 0,
        take: Math.min(take ?? 20, 100),
        include: { items: true },
        orderBy: { issueDate: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data: invoices, total, skip: skip ?? 0, take: take ?? 20 };
  }

  async findOne(tenantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: { items: { include: { service: true } } },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.invoice.count({ where: { tenantId } });
    return `INV-${String(count + 1).padStart(6, '0')}`;
  }

  private calculateTotals(items: { quantity: number; unitPrice: number; taxRate: number }[]) {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = items.reduce((sum, item) => sum + item.quantity * item.unitPrice * (item.taxRate / 100), 0);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }

  async create(tenantId: string, userId: string, data: CreateInvoice) {
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);
    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        ...data,
        invoiceNumber,
        subtotal: 0,
        tax: 0,
        total: 0,
        balance: 0,
      },
      include: { items: true },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'invoice.create',
      resourceType: 'invoice',
      resourceId: invoice.id,
      result: 'success',
    });

    return invoice;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateInvoice) {
    const existing = await this.findOne(tenantId, id);
    const invoice = await this.prisma.invoice.update({
      where: { id: existing.id },
      data,
      include: { items: true },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'invoice.update',
      resourceType: 'invoice',
      resourceId: invoice.id,
      result: 'success',
    });

    return invoice;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.invoice.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'invoice.delete',
      resourceType: 'invoice',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }

  async addItem(tenantId: string, userId: string, invoiceId: string, data: CreateInvoiceItem) {
    await this.findOne(tenantId, invoiceId);
    const itemTotal = data.quantity * data.unitPrice * (1 + data.taxRate / 100);

    const item = await this.prisma.invoiceItem.create({
      data: {
        tenantId,
        invoiceId,
        ...data,
        total: itemTotal,
      },
      include: { service: true },
    });

    const items = await this.prisma.invoiceItem.findMany({ where: { invoiceId } });
    const { subtotal, tax, total } = this.calculateTotals(items.map((i) => ({
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      taxRate: Number(i.taxRate),
    })));
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { subtotal, tax, total, balance: total },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'invoice_item.create',
      resourceType: 'invoice_item',
      resourceId: item.id,
      result: 'success',
    });

    return item;
  }

  async updateItem(tenantId: string, userId: string, itemId: string, data: UpdateInvoiceItem) {
    const existing = await this.prisma.invoiceItem.findFirst({
      where: { id: itemId, tenantId },
      include: { invoice: true },
    });
    if (!existing || existing.invoice.tenantId !== tenantId) {
      throw new NotFoundException('Invoice item not found');
    }

    const itemData = { ...data } as any;
    const quantity = itemData.quantity ?? existing.quantity;
    const unitPrice = itemData.unitPrice ?? existing.unitPrice;
    const taxRate = itemData.taxRate ?? existing.taxRate;
    itemData.total = quantity * unitPrice * (1 + taxRate / 100);

    const item = await this.prisma.invoiceItem.update({
      where: { id: itemId },
      data: itemData,
      include: { service: true },
    });

    const items = await this.prisma.invoiceItem.findMany({ where: { invoiceId: existing.invoiceId } });
    const { subtotal, tax, total } = this.calculateTotals(items.map((i) => ({
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      taxRate: Number(i.taxRate),
    })));
    await this.prisma.invoice.update({
      where: { id: existing.invoiceId },
      data: { subtotal, tax, total, balance: total },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'invoice_item.update',
      resourceType: 'invoice_item',
      resourceId: item.id,
      result: 'success',
    });

    return item;
  }

  async removeItem(tenantId: string, userId: string, itemId: string) {
    const existing = await this.prisma.invoiceItem.findFirst({
      where: { id: itemId, tenantId },
      include: { invoice: true },
    });
    if (!existing || existing.invoice.tenantId !== tenantId) {
      throw new NotFoundException('Invoice item not found');
    }

    await this.prisma.invoiceItem.delete({ where: { id: itemId } });

    const items = await this.prisma.invoiceItem.findMany({ where: { invoiceId: existing.invoiceId } });
    const { subtotal, tax, total } = this.calculateTotals(items.map((i) => ({
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      taxRate: Number(i.taxRate),
    })));
    await this.prisma.invoice.update({
      where: { id: existing.invoiceId },
      data: { subtotal, tax, total, balance: total },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'invoice_item.delete',
      resourceType: 'invoice_item',
      resourceId: itemId,
      result: 'success',
    });

    return { deleted: true };
  }
}
