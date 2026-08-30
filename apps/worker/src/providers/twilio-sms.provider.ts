import { env } from '@danta/config';
import { CommunicationProvider, SmsMessage, SendResult } from './communication-provider.interface';

/**
 * Twilio Programmable SMS via the REST API (no SDK dependency).
 * Falls back with a clear error when credentials are not configured.
 */
export class TwilioSmsProvider implements CommunicationProvider {
  readonly name = 'twilio';

  static isConfigured(): boolean {
    return Boolean(env.twilioAccountSid && env.twilioAuthToken && env.twilioFromNumber);
  }

  async sendEmail(): Promise<SendResult> {
    return {
      success: false,
      provider: this.name,
      error: 'Twilio SMS provider does not support email',
    };
  }

  async sendSms(message: SmsMessage): Promise<SendResult> {
    if (!TwilioSmsProvider.isConfigured()) {
      return {
        success: false,
        provider: this.name,
        error: 'Twilio credentials are not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER)',
      };
    }
    if (!message.to) {
      return { success: false, provider: this.name, error: 'Recipient phone number is empty' };
    }

    const sid = env.twilioAccountSid;
    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const body = new URLSearchParams({
      To: message.to,
      From: env.twilioFromNumber,
      Body: message.body,
    });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${env.twilioAuthToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const payload = (await response.json()) as { sid?: string; message?: string; code?: number };

      if (!response.ok) {
        return {
          success: false,
          provider: this.name,
          error: `Twilio error ${payload.code ?? response.status}: ${payload.message ?? 'unknown'}`,
        };
      }

      return {
        success: true,
        provider: this.name,
        externalId: payload.sid,
      };
    } catch (error) {
      return {
        success: false,
        provider: this.name,
        error: error instanceof Error ? error.message : 'Twilio request failed',
      };
    }
  }
}
