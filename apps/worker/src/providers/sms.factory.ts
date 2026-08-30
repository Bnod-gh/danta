import { CommunicationProvider } from './communication-provider.interface';
import { MockSmsProvider } from './mock-sms.provider';
import { TwilioSmsProvider } from './twilio-sms.provider';
import { SmtpEmailProvider } from './smtp-email.provider';

let smsProviderInstance: CommunicationProvider | null = null;

/** Returns the configured SMS transport: Twilio when credentials exist, mock otherwise. */
export function getSmsProvider(): CommunicationProvider {
  if (!smsProviderInstance) {
    smsProviderInstance = TwilioSmsProvider.isConfigured() ? new TwilioSmsProvider() : new MockSmsProvider();
  }
  return smsProviderInstance;
}

let emailProviderInstance: CommunicationProvider | null = null;

export function getEmailProvider(): CommunicationProvider {
  if (!emailProviderInstance) {
    emailProviderInstance = new SmtpEmailProvider();
  }
  return emailProviderInstance;
}
