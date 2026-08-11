import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAppointmentType, UpdateAppointmentType } from '@danta/schemas';

@Injectable()
export class AppointmentTypesService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string) {
    return this.prisma.appointmentType.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const appointmentType = await this.prisma.appointmentType.findFirst({
      where: { id, tenantId },
    });
    if (!appointmentType) throw new NotFoundException('Appointment type not found');
    return appointmentType;
  }

  async create(tenantId: string, userId: string, data: CreateAppointmentType) {
    const appointmentType = await this.prisma.appointmentType.create({
      data: { tenantId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'appointment_type.create',
      resourceType: 'appointment_type',
      resourceId: appointmentType.id,
      result: 'success',
    });

    return appointmentType;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateAppointmentType) {
    const existing = await this.findOne(tenantId, id);
    const appointmentType = await this.prisma.appointmentType.update({
      where: { id: existing.id },
      data,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'appointment_type.update',
      resourceType: 'appointment_type',
      resourceId: appointmentType.id,
      result: 'success',
    });

    return appointmentType;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.appointmentType.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'appointment_type.delete',
      resourceType: 'appointment_type',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
