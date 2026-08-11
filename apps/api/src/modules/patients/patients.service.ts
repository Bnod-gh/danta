import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePatient, UpdatePatient, PatientQuery } from '@danta/schemas';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, query: PatientQuery, skip?: number, take?: number) {
    const where: any = { tenantId };
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { patientNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status) {
      where.status = query.status;
    }

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({ where, skip: skip ?? 0, take: Math.min(take ?? 20, 100), orderBy: { createdAt: 'desc' } }),
      this.prisma.patient.count({ where }),
    ]);

    return { data: patients, total, skip: skip ?? 0, take: take ?? 20 };
  }

  async findOne(tenantId: string, id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, tenantId },
      include: {
        addresses: true,
        contacts: true,
        medicalHistory: true,
        allergies: true,
        medications: true,
        alerts: { where: { isActive: true } },
        consents: true,
        documents: true,
      },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async findByNumber(tenantId: string, patientNumber: string) {
    return this.prisma.patient.findFirst({
      where: { tenantId, patientNumber },
    });
  }

  async create(tenantId: string, userId: string, data: CreatePatient) {
    const patientNumber = `P${Date.now().toString().slice(-8)}`;
    const patient = await this.prisma.patient.create({
      data: {
        tenantId,
        patientNumber,
        ...data,
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient.create',
      resourceType: 'patient',
      resourceId: patient.id,
      result: 'success',
    });

    return patient;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdatePatient) {
    const existing = await this.findOne(tenantId, id);
    if (!existing) throw new NotFoundException('Patient not found');

    const patient = await this.prisma.patient.update({
      where: { id: existing.id },
      data,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient.update',
      resourceType: 'patient',
      resourceId: patient.id,
      result: 'success',
    });

    return patient;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    if (!existing) throw new NotFoundException('Patient not found');

    await this.prisma.patient.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient.delete',
      resourceType: 'patient',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
