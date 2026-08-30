import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  allowedClaimTransitions,
  CreateClaim,
  ClaimQuery,
  InsuranceClaimStatus,
  UpdateClaimStatus,
} from '@danta/schemas';

const CLAIM_HISTORY_INCLUDE = {
  patients: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
  invoices: { select: { id: true, invoiceNumber: true } },
} as const;

@Injectable()
export class ClaimsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  private async generateClaimNumber(tenantId: string): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const count = await this.prisma.insurance_claims.count({ where: { tenantId } });
      const candidate = `CLM-${new Date().getFullYear()}-${String(count + 1 + attempt).padStart(5, '0')}`;
      const clash = await this.prisma.insurance_claims.findFirst({ where: { tenantId, claimNumber: candidate }, select: { id: true } });
      if (!clash) return candidate;
    }
    return `CLM-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
  }

  async findAllClaims(tenantId: string, query: ClaimQuery) {
    const where: Record<string, unknown> = { tenantId };
    if (query.status) where.status = query.status;
    if (query.patientId) where.patientId = query.patientId;
    if (query.invoiceId) where.invoiceId = query.invoiceId;
    return this.prisma.insurance_claims.findMany({
      where,
      include: CLAIM_HISTORY_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneClaim(tenantId: string, id: string) {
    const claim = await this.prisma.insurance_claims.findFirst({
      where: { id, tenantId },
      include: { ...CLAIM_HISTORY_INCLUDE, insurance_claim_history: { orderBy: { createdAt: 'asc' } } },
    });
    if (!claim) throw new NotFoundException('Insurance claim not found');
    return claim;
  }

  async createClaim(tenantId: string, userId: string, data: CreateClaim) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: data.invoiceId, tenantId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    if (data.integrationId) {
      const integration = await this.prisma.claimIntegration.findFirst({ where: { id: data.integrationId, tenantId } });
      if (!integration) throw new NotFoundException('Claim integration not found');
    }

    const amount = Number(invoice.insuranceAmount) > 0 ? Number(invoice.insuranceAmount) : Number(invoice.balance);
    if (amount <= 0) throw new BadRequestException('Invoice has no insurable amount outstanding');

    const claim = await this.prisma.insurance_claims.create({
      data: {
        tenantId,
        invoiceId: invoice.id,
        patientId: invoice.patientId,
        ...(data.integrationId ? { integrationId: data.integrationId } : {}),
        claimNumber: await this.generateClaimNumber(tenantId),
        status: 'draft',
        amount,
        ...(data.notes?.trim() ? { notes: data.notes.trim() } : {}),
      },
    });

    await this.prisma.insurance_claim_history.create({
      data: { claimId: claim.id, status: 'draft', note: `Draft created from invoice ${invoice.invoiceNumber}` },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'claim.create',
      resourceType: 'insurance_claim',
      resourceId: claim.id,
      result: 'success',
    });

    return claim;
  }

  async submitClaim(tenantId: string, userId: string, id: string, integrationId?: string) {
    const claim = await this.findOneClaim(tenantId, id);
    if (!allowedClaimTransitions(claim.status).includes('submitted')) {
      throw new BadRequestException(`Cannot submit a claim with status: ${claim.status}`);
    }

    let resolvedIntegrationId = integrationId ?? claim.integrationId ?? undefined;
    if (!resolvedIntegrationId) {
      const integration = await this.prisma.claimIntegration.findFirst({
        where: { tenantId, isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!integration) throw new BadRequestException('No active claim integration configured');
      resolvedIntegrationId = integration.id;
    }

    const submitted = await this.prisma.insurance_claims.update({
      where: { id: claim.id },
      data: {
        status: 'submitted',
        integrationId: resolvedIntegrationId,
        externalClaimId: claim.externalClaimId ?? `${claim.claimNumber}-${Date.now().toString(36).toUpperCase()}`,
        submittedAt: new Date(),
      },
    });

    await this.prisma.insurance_claim_history.create({
      data: { claimId: claim.id, status: 'submitted', note: 'Submitted to insurer' },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'claim.submit',
      resourceType: 'insurance_claim',
      resourceId: claim.id,
      result: 'success',
    });

    return submitted;
  }

  async updateClaimStatus(tenantId: string, userId: string, id: string, data: UpdateClaimStatus) {
    const claim = await this.findOneClaim(tenantId, id);
    const allowed = allowedClaimTransitions(claim.status as InsuranceClaimStatus);
    if (!allowed.includes(data.status)) {
      throw new BadRequestException(`Cannot move claim from ${claim.status} to ${data.status}`);
    }
    if ((data.status === 'paid' || data.status === 'partially_paid') && data.paidAmount == null) {
      throw new BadRequestException('paidAmount is required when marking a claim paid');
    }

    const updated = await this.prisma.insurance_claims.update({
      where: { id: claim.id },
      data: {
        status: data.status,
        ...(data.paidAmount != null ? { paidAmount: data.paidAmount } : {}),
        ...(data.rejectionReason ? { rejectionReason: data.rejectionReason } : {}),
        ...(data.providerReference ? { providerReference: data.providerReference } : {}),
        processedAt: ['paid', 'partially_paid', 'denied'].includes(data.status) ? new Date() : claim.processedAt,
      },
    });

    await this.prisma.insurance_claim_history.create({
      data: {
        claimId: claim.id,
        status: data.status,
        note:
          data.note ??
          ([
            data.paidAmount != null ? `Paid ${data.paidAmount.toFixed(2)}` : null,
            data.rejectionReason ?? null,
          ]
            .filter(Boolean)
            .join(' — ') || `Status set to ${data.status}`),
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'claim.status_update',
      resourceType: 'insurance_claim',
      resourceId: claim.id,
      result: 'success',
    });

    return updated;
  }

  async getClaimHistory(tenantId: string, id: string) {
    await this.findOneClaim(tenantId, id);
    return this.prisma.insurance_claim_history.findMany({
      where: { claimId: id },
      orderBy: { createdAt: 'asc' },
    });
  }
}
