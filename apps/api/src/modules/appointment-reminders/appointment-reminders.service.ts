import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAppointmentReminder, UpdateAppointmentReminder } from '@danta/schemas';

@Injectable()
export class AppointmentRemindersService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, appointmentId?: string) {
    const where: any = { tenantId };
    if (appointmentId) where.appointmentId = appointmentId;
    return this.prisma.appointmentReminder.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const reminder = await this.prisma.appointmentReminder.findFirst({
      where: { id, tenantId },
    });
    if (!reminder) throw new NotFoundException('Appointment reminder not found');
    return reminder;
  }

  async create(tenantId: string, userId: string, data: CreateAppointmentReminder) {
    const reminder = await this.prisma.appointmentReminder.create({
      data: { tenantId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'appointment_reminder.create',
      resourceType: 'appointment_reminder',
      resourceId: reminder.id,
      result: 'success',
    });

    return reminder;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateAppointmentReminder) {
    const existing = await this.findOne(tenantId, id);
    const reminder = await this.prisma.appointmentReminder.update({
      where: { id: existing.id },
      data,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'appointment_reminder.update',
      resourceType: 'appointment_reminder',
      resourceId: reminder.id,
      result: 'success',
    });

    return reminder;
  }
}
