import nodemailer from 'nodemailer';
import { CommunicationProvider, EmailMessage, SendResult } from './communication-provider.interface';
import { env } from '@danta/config';

export class SmtpEmailProvider implements CommunicationProvider {
  readonly name = 'smtp';

  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.smtpHost || 'localhost',
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: env.smtpUser
        ? {
            user: env.smtpUser,
            pass: env.smtpPass,
          }
        : undefined,
    });
  }

  async sendEmail(message: EmailMessage): Promise<SendResult> {
    try {
      const info = await this.transporter.sendMail({
        from: message.from || env.smtpFrom,
        to: message.to,
        subject: message.subject,
        text: message.body,
        replyTo: message.replyTo,
      });

      return {
        success: true,
        provider: this.name,
        externalId: info.messageId,
      };
    } catch (error) {
      console.error(`SMTP send failed: ${error instanceof Error ? error.message : 'unknown'}`);
      return {
        success: false,
        provider: this.name,
        error: error instanceof Error ? error.message : 'SMTP send failed',
      };
    }
  }

  async sendSms(): Promise<SendResult> {
    return {
      success: false,
      provider: this.name,
      error: 'SMTP provider does not support SMS',
    };
  }
}
