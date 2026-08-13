import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { StatementQuery } from '@danta/schemas';

@Injectable()
export class StatementsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async generate(tenantId: string, query: StatementQuery, userId?: string) {
    const { patientId, fromDate, toDate } = query;

    const invoices = await this.prisma.invoice.findMany({
      where: { tenantId, patientId, issueDate: { gte: fromDate, lte: toDate } },
      select: {
        id: true,
        invoiceNumber: true,
        issueDate: true,
        total: true,
        status: true,
      },
      orderBy: { issueDate: 'asc' },
    });

    const payments = await this.prisma.payment.findMany({
      where: { tenantId, patientId, receivedAt: { gte: fromDate, lte: toDate }, status: 'completed' },
      select: {
        id: true,
        receivedAt: true,
        amount: true,
        method: true,
      },
      orderBy: { receivedAt: 'asc' },
    });

    const refunds = await this.prisma.refund.findMany({
      where: { tenantId, invoiceId: { not: null }, createdAt: { gte: fromDate, lte: toDate } },
      include: { invoice: { where: { patientId } } },
      orderBy: { createdAt: 'asc' },
    });

    const subtotal = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalRefunds = refunds.reduce((sum, r) => sum + Number(r.amount), 0);
    const closingBalance = subtotal - totalPayments - totalRefunds;

    await this.auditService.log({
      tenantId,
      userId,
      action: 'statement.generated',
      resourceType: 'statement',
      result: 'success',
      metadata: { patientId, fromDate, toDate, invoiceCount: invoices.length, paymentCount: payments.length, refundCount: refunds.length },
    });

    return {
      patientId,
      fromDate,
      toDate,
      openingBalance: 0,
      closingBalance,
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.issueDate.toISOString(),
        total: Number(inv.total),
        status: inv.status,
      })),
      payments: payments.map((p) => ({
        id: p.id,
        date: p.receivedAt.toISOString(),
        amount: Number(p.amount),
        method: p.method,
      })),
      refunds: refunds.map((r) => ({
        id: r.id,
        date: r.createdAt.toISOString(),
        amount: Number(r.amount),
        reason: r.reason,
      })),
    };
  }
}
