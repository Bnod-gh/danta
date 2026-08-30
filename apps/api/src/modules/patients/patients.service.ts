import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePatient, UpdatePatient, PatientQuery } from '@danta/schemas';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, query: PatientQuery, skip?: number, take?: number) {
    const where: Prisma.PatientWhereInput = { tenantId };
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

  async getWorkspace(tenantId: string, id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, tenantId },
      include: {
        addresses: true,
        contacts: true,
        medicalHistory: { orderBy: { createdAt: 'desc' }, take: 10 },
        patient_medical_context: true,
        patient_legal_guardians: true,
        patient_relationships_patient_relationships_patientIdTopatients: { orderBy: { createdAt: 'desc' }, take: 10 },
        patient_surgical_history: { orderBy: { surgeryDate: 'desc' }, take: 10 },
        allergies: { orderBy: { createdAt: 'desc' }, take: 20 },
        medications: { orderBy: { createdAt: 'desc' }, take: 20 },
        alerts: { where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 20 },
        consents: { orderBy: { createdAt: 'desc' }, take: 20 },
        documents: { orderBy: { createdAt: 'desc' }, take: 20 },
        appointments: {
          orderBy: { startTime: 'desc' },
          take: 10,
          include: { appointmentType: { select: { name: true } }, provider: { select: { firstName: true, lastName: true } }, chair: { select: { name: true } } },
        },
        clinicalNotes: { orderBy: { createdAt: 'desc' }, take: 15 },
        dentalCharts: {
          orderBy: { chartDate: 'desc' },
          take: 5,
          include: { conditions: true },
        },
        treatmentHistory: { orderBy: { date: 'desc' }, take: 15 },
        treatmentPlans: { orderBy: { createdAt: 'desc' }, take: 5 },
        periodontalRecords: { orderBy: { chartDate: 'desc' }, take: 5 },
        imagingStudies: {
          orderBy: { studyDate: 'desc' },
          take: 5,
          include: { images: true },
        },
        forms: { orderBy: { createdAt: 'desc' }, take: 10 },
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
        payments: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async create(tenantId: string, userId: string, data: CreatePatient) {
    const patientNumber = `P${randomBytes(4).toString('hex').toUpperCase()}`;
    const patient = await this.prisma.patient.create({
      data: {
        ...data,
        tenantId,
        patientNumber,
      } as Prisma.PatientCreateInput,
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
    const result = await this.prisma.patient.updateMany({
      where: { id, tenantId },
      data: data as Prisma.PatientUpdateManyMutationInput,
    });
    
    if (result.count === 0) {
      throw new NotFoundException('Patient not found');
    }

    const patient = await this.findOne(tenantId, id);

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
    const result = await this.prisma.patient.deleteMany({ 
      where: { id, tenantId } 
    });

    if (result.count === 0) {
      throw new NotFoundException('Patient not found');
    }

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient.delete',
      resourceType: 'patient',
      resourceId: id,
      result: 'success',
    });

    return { deleted: true };
  }

  async getImaging(tenantId: string, patientId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    const studies = await this.prisma.imagingStudy.findMany({
      where: { tenantId, patientId },
      include: {
        provider: { select: { id: true, firstName: true, lastName: true } },
        images: true,
      },
      orderBy: { studyDate: 'desc' },
    });
    return studies;
  }
}
