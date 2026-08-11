import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateRefund, UpdateRefund, CreateCreditNote } from '@danta/schemas';

@Injectable()
export class RefundsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, paymentId?: string) {
    const where: any = { tenantId };
    if (paymentId) where.paymentId = paymentId;
    return this.prisma.refund.findMany({
      where,
      include: { invoice: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const refund = await this.prisma.refund.findFirst({
      where: { id, tenantId },
      include: { invoice: true },
    });
    if (!refund) throw new NotFoundException('Refund not found');
    return refund;
  }

  async create(tenantId: string, userId: string, data: CreateRefund) {
    const payment = await this.prisma.payment.findFirst({ where: { id: data.paymentId, tenantId } });
    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.status !== 'completed') {
      throw new BadRequestException('Can only refund completed payments');
    }

    const refund = await this.prisma.refund.create({
      data: { tenantId, ...data },
      include: { invoice: true },
    });

    await this.prisma.payment.update({
      where: { id: data.paymentId },
      data: { status: 'reversed' },
    });

    if (data.invoiceId) {
      const invoice = await this.prisma.invoice.findFirst({ where: { id: data.invoiceId, tenantId } });
      if (invoice) {
        await this.prisma.invoice.update({
          where: { id: data.invoiceId },
          data: { status: 'refunded' },
        });
      }
    }

    await this.auditService.log({
      tenantId,
      userId,
      action: 'refund.create',
      resourceType: 'refund',
      resourceId: refund.id,
      result: 'success',
    });

    return refund;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateRefund) {
    const existing = await this.findOne(tenantId, id);
    const refund = await this.prisma.refund.update({
      where: { id: existing.id },
      data,
      include: { invoice: true },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'refund.update',
      resourceType: 'refund',
      resourceId: refund.id,
      result: 'success',
    });

    return refund;
  }

  async createCreditNote(tenantId: string, userId: string, data: CreateCreditNote) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id: data.invoiceId, tenantId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const creditNote = await this.prisma.creditNote.create({
      data: { tenantId, ...data },
      include: { invoice: true },
    });

    const newBalance = Number(invoice.balance) - Number(data.amount);
    await this.prisma.invoice.update({
      where: { id: data.invoiceId },
      data: { balance: newBalance },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'credit_note.create',
      resourceType: 'credit_note',
      resourceId: creditNote.id,
      result: 'success',
    });

    return creditNote;
  }

  async getCreditNote(tenantId: string, id: string) {
    const creditNote = await this.prisma.creditNote.findFirst({
      where: { id, tenantId },
      include: { invoice: true },
    });
    if (!creditNote) throw new NotFoundException('Credit note not found');
    return creditNote;
  }
}
