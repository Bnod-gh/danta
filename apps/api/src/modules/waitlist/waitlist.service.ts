import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateWaitlist, UpdateWaitlist, WaitlistQuery } from '@danta/schemas';

@Injectable()
export class WaitlistService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, query: WaitlistQuery) {
    const where: any = {
      tenantId,
      patient: { status: { notIn: ['inactive', 'deceased'] } },
    };
    if (query.patientId) where.patientId = query.patientId;
    if (query.providerId) where.providerId = query.providerId;
    if (query.status) where.status = query.status;

    const entries = await this.prisma.waitlist.findMany({
      where,
      orderBy: { preferredStartTime: 'asc' },
    });

    return entries;
  }

  async findOne(tenantId: string, id: string) {
    const entry = await this.prisma.waitlist.findFirst({
      where: { id, tenantId },
    });
    if (!entry) throw new NotFoundException('Waitlist entry not found');
    return entry;
  }

  async create(tenantId: string, userId: string, data: CreateWaitlist) {
    if (data.preferredStartTime >= data.preferredEndTime) {
      throw new BadRequestException('Preferred start time must be before end time');
    }

    const entry = await this.prisma.waitlist.create({
      data: { tenantId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'waitlist.create',
      resourceType: 'waitlist',
      resourceId: entry.id,
      result: 'success',
    });

    return entry;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateWaitlist) {
    const existing = await this.findOne(tenantId, id);

    if (data.preferredStartTime && data.preferredEndTime && data.preferredStartTime >= data.preferredEndTime) {
      throw new BadRequestException('Preferred start time must be before end time');
    }

    const entry = await this.prisma.waitlist.update({
      where: { id: existing.id },
      data,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'waitlist.update',
      resourceType: 'waitlist',
      resourceId: existing.id,
      result: 'success',
    });

    return entry;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);

    await this.prisma.waitlist.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'waitlist.delete',
      resourceType: 'waitlist',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }

  async bookFromWaitlist(tenantId: string, userId: string, waitlistId: string, appointmentData: {
    patientId: string;
    providerId?: string;
    chairId?: string;
    appointmentTypeId?: string;
    startTime: Date;
    endTime: Date;
    notes?: string;
  }) {
    const waitlistEntry = await this.findOne(tenantId, waitlistId);
    if (waitlistEntry.status === 'booked') {
      throw new BadRequestException('Waitlist entry is already booked');
    }
    if (waitlistEntry.status === 'cancelled') {
      throw new BadRequestException('Cannot book from a cancelled waitlist entry');
    }

    const providerId = appointmentData.providerId || waitlistEntry.providerId;
    const chairId = appointmentData.chairId || waitlistEntry.chairId;

    if (!providerId || !chairId) {
      throw new BadRequestException('Provider and chair are required to book from waitlist');
    }

    if (appointmentData.startTime >= appointmentData.endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    const overlapping = await this.prisma.appointment.findFirst({
      where: {
        tenantId,
        OR: [{ providerId }, { chairId }],
        startTime: { lt: appointmentData.endTime },
        endTime: { gt: appointmentData.startTime },
        status: { not: 'cancelled' },
      },
    });

    if (overlapping) {
      throw new BadRequestException('Time slot conflicts with an existing appointment');
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        tenantId,
        patientId: appointmentData.patientId || waitlistEntry.patientId,
        providerId,
        chairId,
        appointmentTypeId: appointmentData.appointmentTypeId || waitlistEntry.appointmentTypeId || '',
        startTime: appointmentData.startTime,
        endTime: appointmentData.endTime,
        status: 'scheduled',
        notes: appointmentData.notes || waitlistEntry.notes || undefined,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true, color: true } },
        chair: { select: { id: true, name: true } },
        appointmentType: { select: { id: true, name: true, duration: true, color: true } },
      },
    });

    await this.prisma.waitlist.update({
      where: { id: waitlistEntry.id },
      data: { status: 'booked', bookedAppointmentId: appointment.id },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'waitlist.book',
      resourceType: 'waitlist',
      resourceId: waitlistEntry.id,
      result: 'success',
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'appointment.create',
      resourceType: 'appointment',
      resourceId: appointment.id,
      result: 'success',
    });

    return { appointment, waitlistEntry: await this.findOne(tenantId, waitlistId) };
  }
}
