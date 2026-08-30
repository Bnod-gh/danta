import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateImagingImage, UpdateImagingImage } from '@danta/schemas';
import { Inject } from '@nestjs/common';
import { STORAGE_PROVIDER } from '../../storage/storage.module';
import { StorageProvider } from '../../storage/storage.interface';
import * as crypto from 'crypto';

@Injectable()
export class ImagingImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: StorageProvider,
  ) {}

  async findAll(tenantId: string, imagingStudyId?: string) {
    const where: any = { tenantId };
    if (imagingStudyId) where.imagingStudyId = imagingStudyId;
    return this.prisma.imagingImage.findMany({
      where,
      include: {
        imagingStudy: {
          include: {
            patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
            provider: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const image = await this.prisma.imagingImage.findFirst({
      where: { id, tenantId },
      include: { imagingStudy: { include: { patient: true, provider: true } } },
    });
    if (!image) throw new NotFoundException('Imaging image not found');
    return image;
  }

  async upload(
    tenantId: string,
    userId: string,
    file: Buffer,
    metadata: { imagingStudyId: string; fileName: string; mimeType: string; toothNumber?: string },
  ) {
    const study = await this.prisma.imagingStudy.findFirst({
      where: { id: metadata.imagingStudyId, tenantId },
    });
    if (!study) throw new NotFoundException('Imaging study not found');

    const storageKey = `${tenantId}/${metadata.imagingStudyId}/${crypto.createHash('sha1').update(metadata.fileName + Date.now()).digest('hex')}.${this.getExtension(metadata.mimeType)}`;
    const url = this.storageProvider.getUrl(storageKey);
    await this.storageProvider.upload(storageKey, file, metadata.mimeType);

    const image = await this.prisma.imagingImage.create({
      data: {
        tenantId,
        imagingStudyId: metadata.imagingStudyId,
        toothNumber: metadata.toothNumber,
        imageType: 'original',
        fileName: metadata.fileName,
        mimeType: metadata.mimeType,
        size: file.length,
        storageKey,
        url,
        uploadedBy: userId,
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'imaging_image.upload',
      resourceType: 'imaging_image',
      resourceId: image.id,
      result: 'success',
    });

    return image;
  }

  async getOriginal(tenantId: string, id: string): Promise<{ url: string; mimeType: string; fileName: string }> {
    const image = await this.findOne(tenantId, id);
    return {
      url: `/storage/${image.storageKey}`,
      mimeType: image.mimeType,
      fileName: image.fileName,
    };
  }

  async getThumbnail(tenantId: string, id: string): Promise<{ url: string; mimeType: string; fileName: string }> {
    const image = await this.findOne(tenantId, id);
    const thumbnail = await this.prisma.imagingImage.findFirst({
      where: { tenantId, imagingStudyId: image.imagingStudyId, imageType: 'thumbnail' },
    });
    if (thumbnail) {
      return {
        url: `/storage/${thumbnail.storageKey}`,
        mimeType: thumbnail.mimeType,
        fileName: thumbnail.fileName,
      };
    }
    return {
      url: `/storage/${image.storageKey}`,
      mimeType: image.mimeType,
      fileName: image.fileName,
    };
  }

  private getExtension(mimeType: string): string {
    const ext: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/tiff': 'tiff',
      'image/dicom': 'dcm',
    };
    return ext[mimeType] || 'bin';
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
