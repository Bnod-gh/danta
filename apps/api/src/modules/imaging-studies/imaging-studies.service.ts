import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateImagingStudy, UpdateImagingStudy, ImagingStudyQuery } from '@danta/schemas';

@Injectable()
export class ImagingStudiesService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, query: ImagingStudyQuery) {
    const where: any = { tenantId };
    if (query.patientId) where.patientId = query.patientId;
    if (query.providerId) where.providerId = query.providerId;
    if (query.modality) where.modality = query.modality;
    if (query.status) where.status = query.status;
    if (query.startFrom || query.startTo) {
      where.studyDate = {};
      if (query.startFrom) where.studyDate.gte = query.startFrom;
      if (query.startTo) where.studyDate.lte = query.startTo;
    }

    const studies = await this.prisma.imagingStudy.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
        images: true,
      },
      orderBy: { studyDate: 'desc' },
    });

    return studies;
  }

  async findOne(tenantId: string, id: string) {
    const study = await this.prisma.imagingStudy.findFirst({
      where: { id, tenantId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
        images: true,
      },
    });
    if (!study) throw new NotFoundException('Imaging study not found');
    return study;
  }

  async batchConditions(
    tenantId: string,
    params: { patientId: string; toothNumbers?: number[]; modality?: string },
  ) {
    const { patientId, toothNumbers, modality } = params;
    const where: any = { tenantId };
    if (toothNumbers && toothNumbers.length > 0) {
      where.toothNumber = { in: toothNumbers };
    }
    if (modality) {
      where.modality = modality;
    }
    const studies = await this.prisma.imagingStudy.findMany({
      where: { ...where, patientId },
      select: {
        id: true,
        modality: true,
        studyDate: true,
        status: true,
      },
      orderBy: { studyDate: 'desc' },
    });
    return studies;
  }

  async create(tenantId: string, userId: string, data: CreateImagingStudy) {
    const patient = await this.prisma.patient.findFirst({ where: { id: data.patientId, tenantId } });
    if (!patient) throw new BadRequestException('Patient not found in tenant');

    const provider = await this.prisma.provider.findFirst({ where: { id: data.providerId, tenantId } });
    if (!provider) throw new BadRequestException('Provider not found in tenant');

    const study = await this.prisma.imagingStudy.create({
      data: { tenantId, ...data },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
        images: true,
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'imaging_study.create',
      resourceType: 'imaging_study',
      resourceId: study.id,
      result: 'success',
    });

    return study;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateImagingStudy) {
    const existing = await this.findOne(tenantId, id);
    if (data.patientId) {
      const patient = await this.prisma.patient.findFirst({ where: { id: data.patientId, tenantId } });
      if (!patient) throw new BadRequestException('Patient not found in tenant');
    }
    if (data.providerId) {
      const provider = await this.prisma.provider.findFirst({ where: { id: data.providerId, tenantId } });
      if (!provider) throw new BadRequestException('Provider not found in tenant');
    }
    const study = await this.prisma.imagingStudy.update({
      where: { id: existing.id },
      data,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
        images: true,
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'imaging_study.update',
      resourceType: 'imaging_study',
      resourceId: study.id,
      result: 'success',
    });

    return study;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.imagingStudy.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'imaging_study.delete',
      resourceType: 'imaging_study',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
