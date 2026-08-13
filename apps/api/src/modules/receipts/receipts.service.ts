import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ReceiptsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async generate(tenantId: string, paymentId: string, userId?: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
      include: {
        allocations: { include: { invoice: true } },
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    const patient = await this.prisma.patient.findFirst({
      where: { id: payment.patientId, tenantId },
      select: { id: true, firstName: true, lastName: true, patientNumber: true },
    });

    const receiptNumber = `RCP-${paymentId.slice(0, 8).toUpperCase()}`;

    await this.auditService.log({
      tenantId: payment.tenantId,
      userId,
      action: 'receipt.generated',
      resourceType: 'receipt',
      resourceId: payment.id,
      result: 'success',
      metadata: { paymentId: payment.id, receiptNumber, amount: Number(payment.amount) },
    });

    return {
      id: payment.id,
      tenantId: payment.tenantId,
      paymentId: payment.id,
      receiptNumber,
      amount: Number(payment.amount),
      currency: payment.currency,
      method: payment.method,
      patientId: payment.patientId,
      issuedAt: new Date().toISOString(),
      createdAt: payment.createdAt.toISOString(),
      patient,
      allocations: payment.allocations,
      reference: payment.reference,
    };
  }
}
