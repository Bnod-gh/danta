import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';

export interface CreateAvailability {
  providerId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes?: number;
}
export type UpdateAvailability = Partial<CreateAvailability>;

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, providerId?: string) {
    const where: Prisma.provider_shiftsWhereInput = { tenantId };
    if (providerId) where.providerId = providerId;
    return this.prisma.provider_shifts.findMany({ where, orderBy: { dayOfWeek: 'asc' } });
  }

  async findOne(tenantId: string, id: string) {
    const availability = await this.prisma.provider_shifts.findFirst({ where: { id, tenantId } });
    if (!availability) throw new NotFoundException('Availability not found');
    return availability;
  }

  async create(tenantId: string, userId: string, data: CreateAvailability) {
    const availability = await this.prisma.provider_shifts.create({ data: { tenantId, ...data } as Prisma.provider_shiftsUncheckedCreateInput });
    await this.auditService.log({ tenantId, userId, action: 'availability.create', resourceType: 'availability', resourceId: availability.id, result: 'success' });
    return availability;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateAvailability) {
    const existing = await this.findOne(tenantId, id);
    const availability = await this.prisma.provider_shifts.update({ where: { id: existing.id }, data: data as Prisma.provider_shiftsUncheckedUpdateInput });
    await this.auditService.log({ tenantId, userId, action: 'availability.update', resourceType: 'availability', resourceId: availability.id, result: 'success' });
    return availability;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.provider_shifts.delete({ where: { id: existing.id } });
    await this.auditService.log({ tenantId, userId, action: 'availability.delete', resourceType: 'availability', resourceId: existing.id, result: 'success' });
    return { deleted: true };
  }
}
