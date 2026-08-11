import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateMessage, UpdateMessage, MessageQuery } from '@danta/schemas';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, query: MessageQuery, skip?: number, take?: number) {
    const where: any = { tenantId };
    if (query.patientId) where.patientId = query.patientId;
    if (query.channel) where.channel = query.channel;
    if (query.status) where.status = query.status;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip: skip ?? 0,
        take: Math.min(take ?? 20, 100),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.message.count({ where }),
    ]);

    return { data: messages, total, skip: skip ?? 0, take: take ?? 20 };
  }

  async findOne(tenantId: string, id: string) {
    const message = await this.prisma.message.findFirst({
      where: { id, tenantId },
    });
    if (!message) throw new NotFoundException('Message not found');
    return message;
  }

  async create(tenantId: string, userId: string, data: CreateMessage) {
    const message = await this.prisma.message.create({
      data: { tenantId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'message.create',
      resourceType: 'message',
      resourceId: message.id,
      result: 'success',
    });

    return message;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateMessage) {
    const existing = await this.findOne(tenantId, id);
    const message = await this.prisma.message.update({
      where: { id: existing.id },
      data,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'message.update',
      resourceType: 'message',
      resourceId: message.id,
      result: 'success',
    });

    return message;
  }
}
