import { Injectable, Logger } from '@nestjs/common';
import { CommunicationProvider, SmsMessage, SendResult } from './communication-provider.interface';

@Injectable()
export class MockSmsProvider implements CommunicationProvider {
  private readonly logger = new Logger(MockSmsProvider.name);
  readonly name = 'mock-sms';

  async sendEmail(_message: { to: string; subject?: string; body?: string }): Promise<SendResult> {
    return {
      success: false,
      provider: this.name,
      error: 'Mock SMS provider does not support email',
    };
  }

  async sendSms(message: SmsMessage): Promise<SendResult> {
    this.logger.log(`[MOCK SMS] To: ${message.to}, Body: ${message.body}`);
    return {
      success: true,
      provider: this.name,
      externalId: `mock-sms-${Date.now()}`,
    };
  }
}
