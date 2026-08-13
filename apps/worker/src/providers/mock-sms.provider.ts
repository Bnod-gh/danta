import { CommunicationProvider, SmsMessage, SendResult } from './communication-provider.interface';

export class MockSmsProvider implements CommunicationProvider {
  readonly name = 'mock-sms';

  async sendEmail(): Promise<SendResult> {
    return {
      success: false,
      provider: this.name,
      error: 'Mock SMS provider does not support email',
    };
  }

  async sendSms(message: SmsMessage): Promise<SendResult> {
    console.log(`[MOCK SMS] To: ${message.to}, Body: ${message.body}`);
    return {
      success: true,
      provider: this.name,
      externalId: `mock-sms-${Date.now()}`,
    };
  }
}
