import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAppointment, UpdateAppointment, AppointmentQuery } from '@danta/schemas';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, query: AppointmentQuery, skip?: number, take?: number) {
    const where: any = { tenantId };
    if (query.patientId) where.patientId = query.patientId;
    if (query.providerId) where.providerId = query.providerId;
    if (query.status) where.status = query.status;
    if (query.startFrom || query.startTo) {
      where.startTime = {};
      if (query.startFrom) where.startTime.gte = query.startFrom;
      if (query.startTo) where.startTime.lte = query.startTo;
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip: skip ?? 0,
        take: Math.min(take ?? 20, 100),
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          provider: { select: { id: true, firstName: true, lastName: true, color: true } },
          chair: { select: { id: true, name: true } },
          appointmentType: { select: { id: true, name: true, duration: true, color: true } },
        },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data: appointments, total, skip: skip ?? 0, take: take ?? 20 };
  }

  async findOne(tenantId: string, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: {
        patient: true,
        provider: true,
        chair: true,
        appointmentType: true,
      },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async create(tenantId: string, userId: string, data: CreateAppointment) {
    if (data.startTime >= data.endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    await this.checkConflicts(tenantId, data.providerId, data.chairId, data.startTime, data.endTime);

    const appointment = await this.prisma.appointment.create({
      data: { tenantId, ...data },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true, color: true } },
        chair: { select: { id: true, name: true } },
        appointmentType: { select: { id: true, name: true, duration: true, color: true } },
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'appointment.create',
      resourceType: 'appointment',
      resourceId: appointment.id,
      result: 'success',
    });

    return appointment;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateAppointment) {
    const existing = await this.findOne(tenantId, id);

    const startTime = data.startTime ?? existing.startTime;
    const endTime = data.endTime ?? existing.endTime;
    const providerId = data.providerId ?? existing.providerId;
    const chairId = data.chairId ?? existing.chairId;

    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    await this.checkConflicts(tenantId, providerId, chairId, startTime, endTime, id);

    const appointment = await this.prisma.appointment.update({
      where: { id: existing.id },
      data,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true, color: true } },
        chair: { select: { id: true, name: true } },
        appointmentType: { select: { id: true, name: true, duration: true, color: true } },
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'appointment.update',
      resourceType: 'appointment',
      resourceId: appointment.id,
      result: 'success',
    });

    return appointment;
  }

  private async checkConflicts(tenantId: string, providerId: string, chairId: string, startTime: Date, endTime: Date, excludeId?: string) {
    const overlapping = await this.prisma.appointment.findFirst({
      where: {
        tenantId,
        id: excludeId ? { not: excludeId } : undefined,
        OR: [
          { providerId },
          { chairId },
        ],
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        status: { not: 'cancelled' },
      },
    });

    if (overlapping) {
      throw new BadRequestException('Time slot conflicts with an existing appointment');
    }
  }

  async cancel(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    if (existing.status === 'cancelled') {
      throw new BadRequestException('Appointment is already cancelled');
    }

    const appointment = await this.prisma.appointment.update({
      where: { id: existing.id },
      data: { status: 'cancelled' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
        chair: { select: { id: true, name: true } },
        appointmentType: { select: { id: true, name: true, duration: true } },
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'appointment.cancel',
      resourceType: 'appointment',
      resourceId: existing.id,
      result: 'success',
    });

    return appointment;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    if (existing.status === 'cancelled') {
      await this.prisma.appointment.delete({ where: { id: existing.id } });
    } else {
      await this.cancel(tenantId, userId, id);
    }

    await this.auditService.log({
      tenantId,
      userId,
      action: 'appointment.delete',
      resourceType: 'appointment',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }

  async getDaySchedule(tenantId: string, date: string) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59.999`);
    return this.fetchSchedule(tenantId, start, end);
  }

  async getWeekSchedule(tenantId: string, startDate: string) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return this.fetchSchedule(tenantId, start, end);
  }

  async getMonthSchedule(tenantId: string, startDate: string) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    return this.fetchSchedule(tenantId, start, end);
  }

  private async fetchSchedule(tenantId: string, start: Date, end: Date) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        startTime: { gte: start, lt: end },
        status: { not: 'cancelled' },
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
        chair: { select: { id: true, name: true } },
        appointmentType: { select: { id: true, name: true, code: true, duration: true, color: true } },
      },
      orderBy: { startTime: 'asc' },
    });
    return { startDate: start.toISOString(), endDate: end.toISOString(), appointments };
  }
}
