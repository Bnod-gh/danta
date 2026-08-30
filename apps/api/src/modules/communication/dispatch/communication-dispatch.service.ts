import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { CommunicationProviderFactory } from '../providers/communication-provider.factory';
import { EmailMessage, SmsMessage } from '../providers/communication-provider.interface';

@Injectable()
export class CommunicationDispatchService {
  private readonly logger = new Logger(CommunicationDispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: CommunicationProviderFactory,
  ) {}

  async dispatchMessage(messageId: string): Promise<boolean> {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.status === 'sent' || message.status === 'delivered' || message.status === 'read') {
      return true;
    }

    if (message.status === 'failed') {
      this.logger.warn(`Message ${messageId} already failed, skipping`);
      return false;
    }

    if (message.patientId) {
      const preferences = await this.prisma.communicationPreference.findFirst({
        where: { tenantId: message.tenantId, patientId: message.patientId },
      });

      if (preferences) {
        if (message.channel === 'email' && !preferences.emailEnabled) {
          this.logger.warn(`Email disabled for patient ${message.patientId}, skipping message ${messageId}`);
          return false;
        }
        if (message.channel === 'sms' && !preferences.smsEnabled) {
          this.logger.warn(`SMS disabled for patient ${message.patientId}, skipping message ${messageId}`);
          return false;
        }
      }
    }

    let result;
    if (message.channel === 'email') {
      const emailMessage: EmailMessage = {
        to: message.recipient,
        subject: message.subject || '',
        body: message.body,
        patientId: message.patientId || undefined,
        tenantId: message.tenantId,
      };
      result = await this.providerFactory.getEmailProvider().sendEmail(emailMessage);
    } else if (message.channel === 'sms') {
      const smsMessage: SmsMessage = {
        to: message.recipient,
        body: message.body,
        patientId: message.patientId || undefined,
        tenantId: message.tenantId,
      };
      result = await this.providerFactory.getSmsProvider().sendSms(smsMessage);
    } else {
      this.logger.warn(`Unsupported channel: ${message.channel}`);
      return false;
    }

    if (result.success) {
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'sent',
          provider: result.provider,
          externalId: result.externalId,
          sentAt: new Date(),
        },
      });
      return true;
    } else {
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'failed',
          provider: result.provider,
          error: result.error,
        },
      });
      return false;
    }
  }
  async sendMessage(tenantId: string, _userId: string, body: { channel: string; recipient: string; subject?: string; body: string; metadata?: Record<string, unknown> }) {
    const message = await this.prisma.message.create({ data: { tenantId, _userId, channel: body.channel, recipient: body.recipient, subject: body.subject, body: body.body, status: 'pending', metadata: body.metadata } as any });
    return this.dispatchMessage(message.id);
  }

  async getDeliveryStatus(tenantId: string, messageId: string) {
    const message = await this.prisma.message.findFirst({ where: { id: messageId, tenantId } });
    if (!message) throw new NotFoundException('Message not found');
    return { id: message.id, status: message.status, provider: message.provider, error: message.error };
  }

  async retryFailedMessage(tenantId: string, _userId: string, messageId: string) {
    const message = await this.prisma.message.findFirst({ where: { id: messageId, tenantId } });
    if (!message) throw new NotFoundException('Message not found');
    await this.prisma.message.update({ where: { id: messageId }, data: { status: 'pending', error: null } });
    return this.dispatchMessage(messageId);
  }

}
