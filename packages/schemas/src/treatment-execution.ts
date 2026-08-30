import { z } from 'zod';
import { ToothNumberSchema } from './tooth-conditions';
import { ToothSurfaceSchema } from './dental-charting';

const money = z.number().nonnegative();
const percent = z.number().min(0).max(100);

export const PerformTreatmentItemSchema = z.object({
  /** Linked plan item — takes description/fee/tooth defaults from it and completes it. */
  planItemId: z.string().uuid().optional(),
  /** Required when no planItemId is given (ad-hoc treatment). */
  treatment: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  toothNumber: ToothNumberSchema.optional(),
  surfaces: z.array(ToothSurfaceSchema).max(6).optional(),
  cost: money.optional(),
  /** Active findings on this tooth to mark resolved as a result of the treatment. */
  resolveFindingIds: z.array(z.string().uuid()).max(20).optional(),
});
export type PerformTreatmentItem = z.infer<typeof PerformTreatmentItemSchema>;

export const PerformTreatmentsSchema = z.object({
  items: z.array(PerformTreatmentItemSchema).min(1).max(30),
  createInvoice: z.boolean().default(false),
  /** GST rate applied per invoice line when createInvoice is true (AU standard 10). */
  taxRate: percent.default(0),
});
export type PerformTreatments = z.infer<typeof PerformTreatmentsSchema>;
