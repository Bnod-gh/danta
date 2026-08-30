import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateClinicalNote, UpdateClinicalNote } from '@danta/schemas';

@Injectable()
export class ClinicalNotesService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, patientId?: string, skip?: number, take?: number) {
    const where: any = { tenantId };
    if (patientId) where.patientId = patientId;

    const [notes, total] = await Promise.all([
      this.prisma.clinicalNote.findMany({
        where,
        skip: skip ?? 0,
        take: Math.min(take ?? 20, 100),
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          provider: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.clinicalNote.count({ where }),
    ]);

    return { data: notes, total, skip: skip ?? 0, take: take ?? 20 };
  }

  async findOne(tenantId: string, id: string) {
    const note = await this.prisma.clinicalNote.findFirst({
      where: { id, tenantId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!note) throw new NotFoundException('Clinical note not found');
    return note;
  }

  async create(tenantId: string, userId: string, data: CreateClinicalNote) {
    const note = await this.prisma.clinicalNote.create({
      data: { tenantId, ...data },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'clinical_note.create',
      resourceType: 'clinical_note',
      resourceId: note.id,
      result: 'success',
    });

    return note;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateClinicalNote) {
    const existing = await this.findOne(tenantId, id);
    const note = await this.prisma.clinicalNote.update({
      where: { id: existing.id },
      data,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'clinical_note.update',
      resourceType: 'clinical_note',
      resourceId: note.id,
      result: 'success',
    });

    return note;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.clinicalNote.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'clinical_note.delete',
      resourceType: 'clinical_note',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }

  async synthesizeSoap(tenantId: string, userId: string, input: { patientId: string; chiefComplaint?: string; rawDictation?: string; subjective?: string; objective?: string; assessment?: string; plan?: string }) {
    return this.prisma.clinicalNote.create({ data: { tenantId, userId: userId ?? null, patientId: input.patientId, note: input.chiefComplaint ?? input.subjective ?? '', type: 'soap' } as any });
  }

}