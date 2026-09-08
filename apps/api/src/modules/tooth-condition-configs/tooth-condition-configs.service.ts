import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import type {
  CreateToothConditionConfig,
  UpdateToothConditionConfig,
} from '@danta/schemas';

const DEFAULT_CONDITIONS: CreateToothConditionConfig[] = [
  { code: 'caries', name: 'Caries', category: 'diagnosis', color: '#dc2626', surfaces: ['occlusal', 'mesial', 'distal', 'buccal', 'lingual'], cdtCode: 'D2392', cdtDescription: 'Composite restoration — two surfaces', cdtFee: 220, order: 1, isSystem: true, active: true },
  { code: 'filling', name: 'Filling', category: 'restorative', color: '#3b82f6', surfaces: ['occlusal', 'mesial', 'distal', 'buccal', 'lingual'], order: 2, isSystem: true, active: true },
  { code: 'crown', name: 'Crown', category: 'restorative', color: '#d4a017', surfaces: ['occlusal', 'mesial', 'distal', 'buccal', 'lingual'], cdtCode: 'D2740', cdtDescription: 'Crown — porcelain/ceramic', cdtFee: 1250, order: 3, isSystem: true, active: true },
  { code: 'root_canal', name: 'Root Canal Therapy', category: 'endodontics', color: '#9333ea', surfaces: ['root'], cdtCode: 'D3330', cdtDescription: 'Endodontic therapy — molar', cdtFee: 950, order: 4, isSystem: true, active: true },
  { code: 'implant', name: 'Implant', category: 'surgery', color: '#475569', surfaces: [], cdtCode: 'D6010', cdtDescription: 'Surgical placement of implant body', cdtFee: 3500, order: 5, isSystem: true, active: true },
  { code: 'missing', name: 'Missing', category: 'diagnosis', color: '#94a3b8', surfaces: [], order: 6, isSystem: true, active: true },
  { code: 'extraction', name: 'Extraction Needed', category: 'surgery', color: '#ea580c', surfaces: [], cdtCode: 'D7140', cdtDescription: 'Extraction — erupted tooth or exposed root', cdtFee: 250, order: 7, isSystem: true, active: true },
  { code: 'veneer', name: 'Veneer', category: 'restorative', color: '#14b8a6', surfaces: ['buccal'], cdtCode: 'D2962', cdtDescription: 'Veneer restoration — lab fabricated', cdtFee: 900, order: 8, isSystem: true, active: true },
  { code: 'pulpitis', name: 'Pulpitis', category: 'endodontics', color: '#e11d48', surfaces: ['root'], order: 9, isSystem: true, active: true },
  { code: 'abscess', name: 'Abscess', category: 'endodontics', color: '#b91c1c', surfaces: ['root'], order: 10, isSystem: true, active: true },
  { code: 'bridge', name: 'Bridge', category: 'prosthodontics', color: '#7c3aed', surfaces: ['mesial', 'distal'], order: 11, isSystem: true, active: true },
  { code: 'fracture', name: 'Fracture', category: 'trauma', color: '#f97316', surfaces: ['occlusal', 'mesial', 'distal', 'buccal', 'lingual'], order: 12, isSystem: true, active: true },
  { code: 'displaced', name: 'Displaced', category: 'orthodontics', color: '#0ea5e9', surfaces: [], order: 13, isSystem: true, active: true },
  { code: 'sealant', name: 'Sealant', category: 'preventive', color: '#22c55e', surfaces: ['occlusal'], cdtCode: 'D1351', cdtDescription: 'Sealant — per tooth', cdtFee: 45, order: 14, isSystem: true, active: true },
  { code: 'hypoplasia', name: 'Hypoplasia', category: 'diagnosis', color: '#a855f7', surfaces: ['buccal', 'occlusal'], order: 15, isSystem: true, active: true },
];

@Injectable()
export class ToothConditionConfigsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(tenantId: string, active?: boolean) {
    await this.initializeDefaultConditions(tenantId);
    return this.prisma.toothConditionConfig.findMany({
      where: { tenantId, ...(active !== undefined ? { active } : {}) },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(tenantId: string, id: string) {
    const config = await this.prisma.toothConditionConfig.findFirst({
      where: { id, tenantId },
    });
    if (!config) throw new NotFoundException('Tooth condition config not found');
    return config;
  }

  async findByCode(tenantId: string, code: string) {
    return this.prisma.toothConditionConfig.findFirst({
      where: { tenantId, code },
    });
  }

  /** Idempotent — seeds the 15 default conditions the first time a tenant queries them. */
  async initializeDefaultConditions(tenantId: string): Promise<void> {
    const existing = await this.prisma.toothConditionConfig.count({ where: { tenantId } });
    if (existing > 0) return;

    await this.prisma.toothConditionConfig.createMany({
      data: DEFAULT_CONDITIONS.map((c) => ({ tenantId, ...c })),
      skipDuplicates: true,
    });
  }

  async create(tenantId: string, userId: string, data: CreateToothConditionConfig) {
    const existing = await this.prisma.toothConditionConfig.findFirst({
      where: { tenantId, code: data.code },
    });
    if (existing) {
      throw new ConflictException(`A condition with code "${data.code}" already exists`);
    }

    const config = await this.prisma.toothConditionConfig.create({
      data: { tenantId, ...data, cdtFee: data.cdtFee ?? null },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'tooth_condition_config.create',
      resourceType: 'tooth_condition_config',
      resourceId: config.id,
      result: 'success',
    });

    return config;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateToothConditionConfig) {
    const existing = await this.findOne(tenantId, id);
    const config = await this.prisma.toothConditionConfig.update({
      where: { id: existing.id },
      data: { ...data, cdtFee: data.cdtFee ?? null },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'tooth_condition_config.update',
      resourceType: 'tooth_condition_config',
      resourceId: config.id,
      result: 'success',
    });

    return config;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    if (existing.isSystem) {
      throw new ConflictException('System-defined conditions cannot be deleted');
    }
    await this.prisma.toothConditionConfig.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'tooth_condition_config.delete',
      resourceType: 'tooth_condition_config',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }

  async countByCode(tenantId: string, code: string): Promise<number> {
    return this.prisma.toothConditionConfig.count({ where: { tenantId, code } });
  }

  async bulkCreate(tenantId: string, configs: CreateToothConditionConfig[]) {
    return this.prisma.toothConditionConfig.createMany({
      data: configs.map((c) => ({ tenantId, ...c, cdtFee: c.cdtFee ?? null })),
      skipDuplicates: true,
    });
  }
}
