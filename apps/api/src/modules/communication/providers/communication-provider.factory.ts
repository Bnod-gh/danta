import { Injectable } from '@nestjs/common';
import { CommunicationProvider } from './communication-provider.interface';
import { SmtpEmailProvider } from './smtp-email.provider';
import { MockSmsProvider } from './mock-sms.provider';

@Injectable()
export class CommunicationProviderFactory {
  private readonly providers: CommunicationProvider[];

  constructor() {
    this.providers = [new SmtpEmailProvider(), new MockSmsProvider()];
  }

  getEmailProvider(): CommunicationProvider {
    return this.providers.find((p) => p.name === 'smtp') || this.providers[0];
  }

  getSmsProvider(): CommunicationProvider {
    return this.providers.find((p) => p.name === 'mock-sms') || this.providers[1];
  }

  getProvider(name: string): CommunicationProvider | undefined {
    return this.providers.find((p) => p.name === name);
  }
}
