import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import type {
  CreateProviderShift,
  UpdateProviderShift,
  CreateScheduleOverride,
  UpdateScheduleOverride,
  FreeSlotQuery,
} from '@danta/schemas';
import { computeWorkingWindows, findFreeSlots } from './schedule-time';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  // --- Weekly shift template ---

  async listShifts(tenantId: string, providerId?: string) {
    return this.prisma.provider_shifts.findMany({
      where: { tenantId, ...(providerId ? { providerId } : {}) },
      orderBy: [{ providerId: 'asc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async createShift(tenantId: string, userId: string, data: CreateProviderShift) {
    await this.assertProvider(tenantId, data.providerId);
    await this.assertNoShiftOverlap(tenantId, data.providerId, data.dayOfWeek, data.startTime, data.endTime);

    const shift = await this.prisma.provider_shifts.create({
      data: { tenantId, providerId: data.providerId, dayOfWeek: data.dayOfWeek, startTime: data.startTime, endTime: data.endTime },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'schedule-shift.create',
      resourceType: 'provider-shift',
      resourceId: shift.id,
      result: 'success',
    });

    return shift;
  }

  async updateShift(tenantId: string, userId: string, id: string, data: UpdateProviderShift) {
    const existing = await this.prisma.provider_shifts.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Shift not found');

    const providerId = data.providerId ?? existing.providerId;
    const dayOfWeek = data.dayOfWeek ?? existing.dayOfWeek;
    const startTime = data.startTime ?? existing.startTime;
    const endTime = data.endTime ?? existing.endTime;

    if (startTime >= endTime) throw new BadRequestException('Start time must be before end time');
    await this.assertNoShiftOverlap(tenantId, providerId, dayOfWeek, startTime, endTime, id);

    const shift = await this.prisma.provider_shifts.update({
      where: { id: existing.id },
      data: { ...data, providerId: undefined },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'schedule-shift.update',
      resourceType: 'provider-shift',
      resourceId: shift.id,
      result: 'success',
    });

    return shift;
  }

  async removeShift(tenantId: string, userId: string, id: string) {
    const existing = await this.prisma.provider_shifts.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Shift not found');

    await this.prisma.provider_shifts.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'schedule-shift.delete',
      resourceType: 'provider-shift',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }

  // --- Date-specific overrides ---

  async listOverrides(tenantId: string, providerId?: string, from?: string, to?: string) {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (from) {
      const start = new Date(from);
      start.setHours(0, 0, 0, 0);
      dateFilter.gte = start;
    }
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    return this.prisma.schedule_overrides.findMany({
      where: {
        tenantId,
        ...(providerId ? { providerId } : {}),
        ...(from || to ? { date: dateFilter } : {}),
      },
      orderBy: { date: 'asc' },
    });
  }

  async createOverride(tenantId: string, userId: string, data: CreateScheduleOverride) {
    await this.assertProvider(tenantId, data.providerId);

    if (data.isFullDay && (data.startTime || data.endTime)) {
      throw new BadRequestException('Full-day overrides cannot define start or end times');
    }
    if (!data.isFullDay && (!data.startTime || !data.endTime)) {
      throw new BadRequestException('Partial-day overrides require start and end times');
    }
    if (!data.isFullDay && data.startTime && data.endTime && data.startTime >= data.endTime) {
      throw new BadRequestException('Start time must be before end time');
    }
    if (data.type === 'custom_hours' && (!data.startTime || !data.endTime)) {
      throw new BadRequestException('Custom-hours overrides require start and end times');
    }

    const override = await this.prisma.schedule_overrides.create({
      data: {
        tenantId,
        providerId: data.providerId,
        date: data.date,
        type: data.type,
        isFullDay: data.isFullDay,
        startTime: data.startTime,
        endTime: data.endTime,
        reason: data.reason,
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'schedule-override.create',
      resourceType: 'schedule-override',
      resourceId: override.id,
      result: 'success',
    });

    return override;
  }

  async updateOverride(tenantId: string, userId: string, id: string, data: UpdateScheduleOverride) {
    const existing = await this.prisma.schedule_overrides.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Schedule override not found');

    const isFullDay = data.isFullDay ?? existing.isFullDay;
    const startTime = data.startTime ?? existing.startTime;
    const endTime = data.endTime ?? existing.endTime;

    if (isFullDay !== existing.isFullDay) {
      if (isFullDay) {
        if (startTime || endTime) throw new BadRequestException('Full-day overrides cannot define start or end times');
      } else if (!startTime || !endTime) {
        throw new BadRequestException('Partial-day overrides require start and end times');
      }
    }

    const override = await this.prisma.schedule_overrides.update({
      where: { id: existing.id },
      data: { ...data, providerId: undefined },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'schedule-override.update',
      resourceType: 'schedule-override',
      resourceId: override.id,
      result: 'success',
    });

    return override;
  }

  async removeOverride(tenantId: string, userId: string, id: string) {
    const existing = await this.prisma.schedule_overrides.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Schedule override not found');

    await this.prisma.schedule_overrides.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'schedule-override.delete',
      resourceType: 'schedule-override',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }

  // --- Free-slot search ---

  async getFreeSlots(tenantId: string, query: FreeSlotQuery) {
    const provider = await this.prisma.provider.findFirst({
      where: { id: query.providerId, tenantId },
    });
    if (!provider || !provider.isActive) {
      throw new NotFoundException('Active provider not found');
    }

    const dayStart = new Date(query.date.getFullYear(), query.date.getMonth(), query.date.getDate());
    const dayEnd = new Date(query.date.getFullYear(), query.date.getMonth(), query.date.getDate(), 23, 59, 59, 999);

    const [shifts, overrides, appointments] = await Promise.all([
      this.prisma.provider_shifts.findMany({ where: { tenantId, providerId: query.providerId } }),
      this.prisma.schedule_overrides.findMany({ where: { tenantId, providerId: query.providerId } }),
      this.prisma.appointment.findMany({
        where: {
          tenantId,
          providerId: query.providerId,
          startTime: { lt: dayEnd },
          endTime: { gt: dayStart },
          status: { notIn: ['cancelled', 'no_show'] },
        },
        select: { startTime: true, endTime: true },
      }),
    ]);

    const windows = computeWorkingWindows(dayStart, shifts, overrides);
    const busy = appointments.map((appointment) => ({ start: appointment.startTime, end: appointment.endTime }));
    const slots = findFreeSlots(windows, busy, dayStart, query.durationMin, query.stepMin);

    return {
      providerId: query.providerId,
      date: dayStart.toISOString(),
      durationMin: query.durationMin,
      stepMin: query.stepMin,
      slots,
    };
  }

  // --- Helpers ---

  private async assertProvider(tenantId: string, providerId: string) {
    const provider = await this.prisma.provider.findFirst({ where: { id: providerId, tenantId } });
    if (!provider) throw new NotFoundException('Provider not found');
  }

  private async assertNoShiftOverlap(
    tenantId: string,
    providerId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ) {
    const overlapping = await this.prisma.provider_shifts.findFirst({
      where: {
        tenantId,
        providerId,
        dayOfWeek,
        id: excludeId ? { not: excludeId } : undefined,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (overlapping) {
      throw new BadRequestException('Shift overlaps an existing shift for this provider');
    }
  }
}
