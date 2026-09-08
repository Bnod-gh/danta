import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateToothCondition, UpdateToothCondition } from '@danta/schemas';
import { isValidToothNumber } from '@danta/schemas';

@Injectable()
export class ToothConditionsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, dentalChartId?: string) {
    const where: any = { tenantId };
    if (dentalChartId) where.dentalChartId = dentalChartId;
    return this.prisma.toothCondition.findMany({
      where,
      orderBy: { toothNumber: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const condition = await this.prisma.toothCondition.findFirst({
      where: { id, tenantId },
    });
    if (!condition) throw new NotFoundException('Tooth condition not found');
    return condition;
  }

  async create(tenantId: string, userId: string, data: CreateToothCondition) {
    // Tenant isolation: verify the chart belongs to this tenant
    const chart = await this.prisma.dentalChart.findFirst({
      where: { id: data.dentalChartId, tenantId },
    });
    if (!chart) {
      throw new NotFoundException('Dental chart not found or does not belong to this tenant');
    }

    // Validate tooth number
    if (data.toothNumber && !isValidToothNumber(data.toothNumber, data.dentition)) {
      throw new BadRequestException(`Invalid tooth number: ${data.toothNumber}`);
    }

    // Normalize surfaces: deduplicate and set legacy surface mirror
    const surfaces = data.surfaces ?? (data.surface ? [data.surface] : []);
    const uniqueSurfaces = [...new Set(surfaces)];
    const surface = uniqueSurfaces[0] ?? null;

    const condition = await this.prisma.toothCondition.create({
      data: {
        tenantId,
        dentalChartId: data.dentalChartId,
        toothNumber: data.toothNumber ?? null,
        condition: data.condition,
        scope: data.scope ?? 'tooth',
        dentition: data.dentition ?? 'permanent',
        surfaces: uniqueSurfaces,
        surface,
        severity: data.severity ?? null,
        status: data.status ?? 'planned',
        notes: data.notes ?? null,
        providerId: data.providerId ?? null,
        procedureCodeId: data.procedureCodeId ?? null,
        createdByUserId: userId,
        clinicalModule: data.clinicalModule ?? null,
        clinicalStatus: data.clinicalStatus ?? null,
        diagnosis: data.diagnosis ?? null,
        treatmentPlan: data.treatmentPlan ?? null,
        inProgress: data.inProgress ?? false,
        completedAt: data.completedAt ?? null,
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'tooth_condition.create',
      resourceType: 'tooth_condition',
      resourceId: condition.id,
      result: 'success',
    });

    return condition;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateToothCondition) {
    const existing = await this.findOne(tenantId, id);

    // Optimistic concurrency check
    if (data.expectedUpdatedAt) {
      const expected = new Date(data.expectedUpdatedAt);
      if (existing.updatedAt.getTime() !== expected.getTime()) {
        throw new ConflictException('The finding was modified by another clinician. Please refresh and try again.');
      }
    }

    // If the finding is resolved, amend rather than overwrite
    if (existing.status === 'resolved' && (data.condition || data.surfaces)) {
      return this.prisma.$transaction(async (tx) => {
        // Mark the existing finding as superseded
        await tx.toothCondition.update({
          where: { id: existing.id },
          data: { status: 'superseded' },
        });

        // Create the amending row
        const amended = await tx.toothCondition.create({
          data: {
            tenantId,
            dentalChartId: existing.dentalChartId,
            toothNumber: existing.toothNumber,
            condition: data.condition ?? existing.condition,
            scope: existing.scope,
            dentition: existing.dentition,
            surfaces: data.surfaces ?? existing.surfaces,
            surface: data.surfaces?.[0] ?? existing.surface,
            severity: data.severity ?? existing.severity,
            status: 'planned',
            notes: data.notes ?? existing.notes,
            providerId: data.providerId ?? existing.providerId,
            procedureCodeId: existing.procedureCodeId,
            createdByUserId: userId,
            supersedesId: existing.id,
            clinicalModule: data.clinicalModule ?? existing.clinicalModule,
            clinicalStatus: data.clinicalStatus ?? existing.clinicalStatus,
            diagnosis: data.diagnosis ?? existing.diagnosis,
            treatmentPlan: data.treatmentPlan ?? existing.treatmentPlan,
            inProgress: data.inProgress ?? existing.inProgress,
            completedAt: data.completedAt ?? existing.completedAt,
          },
        });

        await this.auditService.log({
          tenantId,
          userId,
          action: 'tooth_condition.amend',
          resourceType: 'tooth_condition',
          resourceId: amended.id,
          result: 'success',
        });

        return amended;
      });
    }

    // Normal update
    const condition = await this.prisma.toothCondition.update({
      where: { id: existing.id },
      data: {
        ...(data.condition !== undefined ? { condition: data.condition } : {}),
        ...(data.surfaces !== undefined ? { surfaces: data.surfaces, surface: data.surfaces[0] ?? null } : {}),
        ...(data.surface !== undefined ? { surface: data.surface } : {}),
        ...(data.severity !== undefined ? { severity: data.severity } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.providerId !== undefined ? { providerId: data.providerId } : {}),
        ...(data.clinicalModule !== undefined ? { clinicalModule: data.clinicalModule } : {}),
        ...(data.clinicalStatus !== undefined ? { clinicalStatus: data.clinicalStatus } : {}),
        ...(data.diagnosis !== undefined ? { diagnosis: data.diagnosis } : {}),
        ...(data.treatmentPlan !== undefined ? { treatmentPlan: data.treatmentPlan } : {}),
        ...(data.inProgress !== undefined ? { inProgress: data.inProgress } : {}),
        ...(data.completedAt !== undefined ? { completedAt: data.completedAt } : {}),
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'tooth_condition.update',
      resourceType: 'tooth_condition',
      resourceId: condition.id,
      result: 'success',
    });

    return condition;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);

    // Soft delete: set status to 'removed' and removedAt timestamp
    await this.prisma.toothCondition.update({
      where: { id: existing.id },
      data: {
        status: 'removed',
        removedAt: new Date(),
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'tooth_condition.delete',
      resourceType: 'tooth_condition',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
