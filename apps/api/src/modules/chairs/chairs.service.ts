import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateChair, UpdateChair, ChairLiveStatus } from '@danta/schemas';
import type { Appointment, Patient, Provider, AppointmentType } from '@prisma/client';

@Injectable()
export class ChairsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string) {
    return this.prisma.chair.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findLive(tenantId: string): Promise<ChairLiveStatus[]> {
    const chairs = await this.prisma.chair.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    const now = new Date();
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        status: { in: ['in_progress', 'scheduled', 'confirmed', 'checked_in'] },
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
        appointmentType: { select: { id: true, name: true, duration: true, code: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    type LiveAppointment = Appointment & {
      patient: Patient & { patientNumber?: string | null };
      provider: Provider;
      appointmentType: AppointmentType & { code?: string | null };
    };

    const byChair = new Map<string, { current: LiveAppointment | null; next: LiveAppointment | null }>();

    for (const appointment of appointments as LiveAppointment[]) {
      const existing = byChair.get(appointment.chairId) || { current: null, next: null };
      const isCurrent = appointment.status === 'in_progress' && appointment.startTime <= now && appointment.endTime >= now;
      const isFuture = appointment.startTime > now;

      if (isCurrent && !existing.current) {
        existing.current = appointment;
      } else if (isFuture && (!existing.next || appointment.startTime < existing.next.startTime)) {
        existing.next = appointment;
      }

      byChair.set(appointment.chairId, existing);
    }

    const mapAppointment = (appointment: LiveAppointment | null) => {
      if (!appointment) return null;
      return {
        appointmentId: appointment.id,
        patientId: appointment.patient.id,
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        patientNumber: appointment.patient.patientNumber ?? null,
        providerName: `${appointment.provider.firstName} ${appointment.provider.lastName}`,
        procedureName: appointment.appointmentType.name,
        procedureCode: appointment.appointmentType.code ?? null,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        scheduledPrice: appointment.scheduledPrice ? Number(appointment.scheduledPrice) : null,
      };
    };

    return chairs.map((chair) => {
      const slot = byChair.get(chair.id) || { current: null, next: null };
      return {
        id: chair.id,
        name: chair.name,
        description: chair.description ?? null,
        locationId: chair.locationId ?? null,
        isActive: chair.isActive,
        currentAppointment: mapAppointment(slot.current),
        nextAppointment: mapAppointment(slot.next),
      };
    });
  }

  async findOne(tenantId: string, id: string) {
    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
      throw new NotFoundException('Chair not found');
    }
    const chair = await this.prisma.chair.findFirst({
      where: { id, tenantId },
    });
    if (!chair) throw new NotFoundException('Chair not found');
    return chair;
  }

  async create(tenantId: string, userId: string, data: CreateChair) {
    const chair = await this.prisma.chair.create({
      data: { tenantId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'chair.create',
      resourceType: 'chair',
      resourceId: chair.id,
      result: 'success',
    });

    return chair;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateChair) {
    const existing = await this.findOne(tenantId, id);
    const chair = await this.prisma.chair.update({
      where: { id: existing.id },
      data,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'chair.update',
      resourceType: 'chair',
      resourceId: chair.id,
      result: 'success',
    });

    return chair;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.chair.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'chair.delete',
      resourceType: 'chair',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
