import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePayment, UpdatePayment, CreatePaymentAllocation } from '@danta/schemas';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, patientId?: string, skip?: number, take?: number) {
    const where: any = { tenantId };
    if (patientId) where.patientId = patientId;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip: skip ?? 0,
        take: Math.min(take ?? 20, 100),
        include: {
          allocations: { include: { invoice: true } },
        },
        orderBy: { receivedAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data: payments, total, skip: skip ?? 0, take: take ?? 20 };
  }

  async findOne(tenantId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, tenantId },
      include: {
        allocations: { include: { invoice: true } },
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async findByPayment(tenantId: string, paymentId: string) {
    return this.prisma.paymentAllocation.findMany({
      where: { paymentId, tenantId },
      include: { invoice: true },
    });
  }

  async create(tenantId: string, userId: string, data: CreatePayment) {
    const existing = await this.prisma.payment.findFirst({
      where: { idempotencyKey: data.idempotencyKey, tenantId },
    });
    if (existing) return existing;

    const payment = await this.prisma.payment.create({
      data: { tenantId, ...data },
      include: {
        allocations: { include: { invoice: true } },
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'payment.create',
      resourceType: 'payment',
      resourceId: payment.id,
      result: 'success',
    });

    return payment;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdatePayment) {
    const existing = await this.findOne(tenantId, id);
    const payment = await this.prisma.payment.update({
      where: { id: existing.id },
      data,
      include: {
        allocations: { include: { invoice: true } },
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'payment.update',
      resourceType: 'payment',
      resourceId: payment.id,
      result: 'success',
    });

    return payment;
  }

  async allocate(tenantId: string, userId: string, data: CreatePaymentAllocation) {
    const payment = await this.prisma.payment.findFirst({ where: { id: data.paymentId, tenantId } });
    if (!payment) throw new NotFoundException('Payment not found');

    const invoice = await this.prisma.invoice.findFirst({ where: { id: data.invoiceId, tenantId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    if (payment.status !== 'completed') {
      throw new BadRequestException('Can only allocate completed payments');
    }

    const existingAllocations = await this.prisma.paymentAllocation.findMany({
      where: { paymentId: data.paymentId, invoiceId: data.invoiceId },
    });
    if (existingAllocations.length > 0) {
      throw new BadRequestException('Payment already allocated to this invoice');
    }

    const allocation = await this.prisma.paymentAllocation.create({
      data: { tenantId, ...data },
      include: { invoice: true },
    });

    const totalAllocated = await this.prisma.paymentAllocation.aggregate({
      where: { invoiceId: data.invoiceId },
      _sum: { amount: true },
    });

    const newBalance = Number(invoice.total) - Number(totalAllocated._sum.amount || 0);
    let newStatus = invoice.status;
    if (newBalance <= 0) {
      newStatus = 'paid';
    } else if (Number(totalAllocated._sum.amount) > 0) {
      newStatus = 'partially_paid';
    }

    await this.prisma.invoice.update({
      where: { id: data.invoiceId },
      data: { balance: newBalance, status: newStatus },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'payment_allocation.create',
      resourceType: 'payment_allocation',
      resourceId: allocation.id,
      result: 'success',
    });

    return allocation;
  }
}
