import { z } from 'zod';

/** Event kinds surfaced on the unified patient clinical timeline. */
export const CLINICAL_TIMELINE_EVENT_TYPES = [
  'appointment',
  'appointment_status',
  'clinical_note',
  'finding',
  'treatment_completed',
  'treatment_plan',
  'estimate',
  'estimate_approval',
  'invoice',
  'payment',
  'refund',
  'recall',
  'communication',
  'document',
] as const;

export const ClinicalTimelineEventTypeSchema = z.enum(CLINICAL_TIMELINE_EVENT_TYPES);
export type ClinicalTimelineEventType = (typeof CLINICAL_TIMELINE_EVENT_TYPES)[number];

export const ClinicalTimelineQuerySchema = z.object({
  types: z.array(ClinicalTimelineEventTypeSchema).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  providerId: z.string().uuid().optional(),
  toothNumber: z.string().max(10).optional(),
  skip: z.coerce.number().int().nonnegative().default(0),
  take: z.coerce.number().int().positive().max(100).default(50),
});
export type ClinicalTimelineQuery = z.infer<typeof ClinicalTimelineQuerySchema>;

export const HistoricalOdontogramQuerySchema = z.object({
  date: z.coerce.date(),
});
export type HistoricalOdontogramQuery = z.infer<typeof HistoricalOdontogramQuerySchema>;

export const ToothHistoryQuerySchema = z.object({
  skip: z.coerce.number().int().nonnegative().default(0),
  take: z.coerce.number().int().positive().max(100).default(50),
});
export type ToothHistoryQuery = z.infer<typeof ToothHistoryQuerySchema>;

export interface ClinicalTimelineEvent {
  id: string;
  type: ClinicalTimelineEventType;
  occurredAt: Date;
  resourceType?: string;
  resourceId?: string;
  title: string;
  detail?: string;
  metadata?: Record<string, unknown>;
}
