import { z } from 'zod';

export const SETTINGS_GROUPS = ['general', 'clinical', 'billing', 'communication'] as const;
export type SettingsGroup = (typeof SETTINGS_GROUPS)[number];

export const GeneralSettingsSchema = z.object({
  defaultLocationId: z.string().uuid().optional(),
  timezone: z.string().max(64).optional(),
  weekStartsOn: z.number().int().min(0).max(6).optional(),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).optional(),
  timeFormat: z.enum(['12h', '24h']).optional(),
});

export type GeneralSettings = z.infer<typeof GeneralSettingsSchema>;

export const ClinicalSettingsSchema = z.object({
  soapNoteEnabled: z.boolean().optional(),
  medicalHistoryRequiredAtBooking: z.boolean().optional(),
  allergyAlertSeverity: z.enum(['all', 'moderate_and_above', 'severe_only']).optional(),
  dentalChartDefaultView: z.enum(['adult', 'pediatric', 'mixed']).optional(),
  clinicalNoteTemplatesEnabled: z.boolean().optional(),
});

export type ClinicalSettings = z.infer<typeof ClinicalSettingsSchema>;

export const BillingSettingsSchema = z.object({
  currency: z.string().length(3).default('AUD'),
  taxRatePercent: z.number().min(0).max(100).optional(),
  taxLabel: z.string().max(32).optional(),
  /** Whether prices entered into invoices are GST-inclusive or GST-exclusive. */
  taxMode: z.enum(['exclusive', 'inclusive']).default('exclusive'),
  invoicePrefix: z.string().max(10).optional(),
  invoicePaymentTermsDays: z.number().int().min(0).max(180).optional(),
  lateFeeEnabled: z.boolean().optional(),
});

export type BillingSettings = z.infer<typeof BillingSettingsSchema>;

export const CommunicationSettingsSchema = z.object({
  smsSenderName: z.string().max(32).optional(),
  replyToEmail: z.string().email().optional(),
  appointmentRemindersEnabled: z.boolean().optional(),
  reminderLeadHours: z.number().int().min(1).max(168).optional(),
  recallRemindersEnabled: z.boolean().optional(),
  marketingOptInRequired: z.boolean().optional(),
});

export type CommunicationSettings = z.infer<typeof CommunicationSettingsSchema>;

export const TenantSettingsSchema = z.object({
  general: GeneralSettingsSchema.optional(),
  clinical: ClinicalSettingsSchema.optional(),
  billing: BillingSettingsSchema.optional(),
  communication: CommunicationSettingsSchema.optional(),
});

export type TenantSettings = z.infer<typeof TenantSettingsSchema>;
