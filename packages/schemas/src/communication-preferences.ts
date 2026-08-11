import { z } from 'zod';
import { MessageChannelSchema } from './communication-templates';

export const CommunicationPreferenceSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  smsEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
  patientPortalEnabled: z.boolean(),
  marketingConsent: z.boolean(),
  reminderChannel: MessageChannelSchema,
  reminderLeadTime: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CommunicationPreference = z.infer<typeof CommunicationPreferenceSchema>;

export const CreateCommunicationPreferenceSchema = z.object({
  patientId: z.string().uuid(),
  smsEnabled: z.boolean().default(true),
  emailEnabled: z.boolean().default(true),
  inAppEnabled: z.boolean().default(true),
  patientPortalEnabled: z.boolean().default(true),
  marketingConsent: z.boolean().default(false),
  reminderChannel: MessageChannelSchema.default('sms'),
  reminderLeadTime: z.number().int().nonnegative().default(24),
});

export type CreateCommunicationPreference = z.infer<typeof CreateCommunicationPreferenceSchema>;

export const UpdateCommunicationPreferenceSchema = z.object({
  smsEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  patientPortalEnabled: z.boolean().optional(),
  marketingConsent: z.boolean().optional(),
  reminderChannel: MessageChannelSchema.optional(),
  reminderLeadTime: z.number().int().nonnegative().optional(),
});

export type UpdateCommunicationPreference = z.infer<typeof UpdateCommunicationPreferenceSchema>;
