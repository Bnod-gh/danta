import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateNotification, NotificationQuery } from '@danta/schemas';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, query: NotificationQuery, skip?: number, take?: number) {
    const where: any = { tenantId };
    if (query.patientId) where.patientId = query.patientId;
    if (query.userId) where.userId = query.userId;
    if (query.type) where.type = query.type;
    if (query.read !== undefined) {
      if (query.read) {
        where.readAt = { not: null };
      } else {
        where.readAt = null;
      }
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: skip ?? 0,
        take: Math.min(take ?? 20, 100),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data: notifications, total, skip: skip ?? 0, take: take ?? 20 };
  }

  async findOne(tenantId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, tenantId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }

  async create(tenantId: string, userId: string, data: CreateNotification) {
    const notification = await this.prisma.notification.create({
      data: { tenantId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'notification.create',
      resourceType: 'notification',
      resourceId: notification.id,
      result: 'success',
    });

    return notification;
  }

  async markAsRead(tenantId: string, id: string) {
    const notification = await this.prisma.notification.updateMany({
      where: { id, tenantId },
      data: { readAt: new Date() },
    });
    return notification;
  }
}
