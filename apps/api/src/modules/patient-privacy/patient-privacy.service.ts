import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PatientPrivacyService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async canAccessPatient(tenantId: string, userId: string, patientId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
      select: { id: true, status: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { id: true, role: true, status: true },
    });

    if (!user || user.status === 'deactivated') {
      throw new ForbiddenException('User not authorized to access patient records');
    }

    return { canAccess: true, patientId, userId };
  }

  async logPatientAccess(tenantId: string, userId: string, patientId: string, action: string) {
    return this.auditService.log({
      tenantId,
      userId,
      action: `patient.${action}`,
      resourceType: 'patient',
      resourceId: patientId,
      result: 'success',
      metadata: { accessType: action },
    });
  }

  async findAccessLogs(tenantId: string, patientId: string, limit?: number, offset?: number) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        resourceType: 'patient',
        resourceId: patientId,
        action: { startsWith: 'patient.' },
      },
      skip: offset ?? 0,
      take: Math.min(limit ?? 50, 100),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    return { data: logs, total: logs.length, skip: offset ?? 0, take: limit ?? 50 };
  }
}
