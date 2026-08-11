import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreatePatientForm, UpdatePatientForm, PatientFormQuery } from '@danta/schemas';

@Injectable()
export class PatientFormsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: PatientFormQuery) {
    const where: any = { tenantId };
    if (query.patientId) where.patientId = query.patientId;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;

    const forms = await this.prisma.patientForm.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return forms;
  }

  async findOne(tenantId: string, id: string) {
    const form = await this.prisma.patientForm.findFirst({
      where: { id, tenantId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  async create(tenantId: string, _userId: string, data: CreatePatientForm) {
    const form = await this.prisma.patientForm.create({
      data: {
        tenantId,
        ...data,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return form;
  }

  async update(tenantId: string, id: string, data: UpdatePatientForm) {
    const existing = await this.findOne(tenantId, id);
    const form = await this.prisma.patientForm.update({
      where: { id: existing.id },
      data,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return form;
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.patientForm.delete({ where: { id: existing.id } });
    return { deleted: true };
  }
}
