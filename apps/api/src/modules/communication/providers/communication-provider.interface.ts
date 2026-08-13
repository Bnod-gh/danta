export interface SendResult {
  success: boolean;
  provider?: string;
  externalId?: string;
  error?: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  from?: string;
  replyTo?: string;
  patientId?: string;
  tenantId?: string;
}

export interface SmsMessage {
  to: string;
  body: string;
  patientId?: string;
  tenantId?: string;
}

export interface CommunicationProvider {
  readonly name: string;
  sendEmail(message: EmailMessage): Promise<SendResult>;
  sendSms(message: SmsMessage): Promise<SendResult>;
}
