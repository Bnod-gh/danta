import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateImagingImage, UpdateImagingImage } from '@danta/schemas';

@Injectable()
export class ImagingImagesService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, imagingStudyId?: string) {
    const where: any = { tenantId };
    if (imagingStudyId) where.imagingStudyId = imagingStudyId;
    return this.prisma.imagingImage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const image = await this.prisma.imagingImage.findFirst({
      where: { id, tenantId },
    });
    if (!image) throw new NotFoundException('Imaging image not found');
    return image;
  }

  async create(tenantId: string, userId: string, data: CreateImagingImage) {
    const image = await this.prisma.imagingImage.create({
      data: { tenantId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'imaging_image.create',
      resourceType: 'imaging_image',
      resourceId: image.id,
      result: 'success',
    });

    return image;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateImagingImage) {
    const existing = await this.findOne(tenantId, id);
    const image = await this.prisma.imagingImage.update({
      where: { id: existing.id },
      data,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'imaging_image.update',
      resourceType: 'imaging_image',
      resourceId: image.id,
      result: 'success',
    });

    return image;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.imagingImage.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'imaging_image.delete',
      resourceType: 'imaging_image',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
