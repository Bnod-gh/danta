import { z } from 'zod';
import { ToothNumberSchema } from './tooth-conditions';
import { ToothSurfaceSchema } from './dental-charting';

export const EstimateStatusSchema = z.enum([
  'draft',
  'presented',
  'approved',
  'partially_approved',
  'rejected',
  'expired',
  'cancelled',
]);
export type EstimateStatus = z.infer<typeof EstimateStatusSchema>;

export const SignatureMethodSchema = z.enum(['in_person', 'written', 'electronic', 'verbal']);
export type SignatureMethod = z.infer<typeof SignatureMethodSchema>;

export const ApprovalDecisionSchema = z.enum(['approved', 'rejected', 'partially_approved']);
export type ApprovalDecision = z.infer<typeof ApprovalDecisionSchema>;

const money = z.number().nonnegative();
const percent = z.number().min(0).max(100);

const estimateItemInput = z.object({
  planItemId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  cdtCode: z.string().max(16).optional(),
  description: z.string().min(1).max(255),
  toothNumber: ToothNumberSchema.optional(),
  surfaces: z.array(ToothSurfaceSchema).max(6).optional(),
  quantity: z.number().int().positive().default(1),
  unitPrice: money,
  discount: money.default(0),
  taxRate: percent.default(0),
});

export const CreateEstimateSchema = z.object({
  patientId: z.string().uuid(),
  providerId: z.string().uuid().optional(),
  treatmentPlanId: z.string().uuid().optional(),
  items: z.array(estimateItemInput).min(1).max(50),
  validUntil: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
});
export type CreateEstimate = z.infer<typeof CreateEstimateSchema>;

/** Builds an estimate from some (default all planned) items of a treatment plan. */
export const CreateEstimateFromPlanSchema = z.object({
  treatmentPlanId: z.string().uuid(),
  itemIds: z.array(z.string().uuid()).optional(),
  validUntil: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
});
export type CreateEstimateFromPlan = z.infer<typeof CreateEstimateFromPlanSchema>;

/** Patient decision recorded by staff on behalf of the patient. IP/user-agent are captured server-side. */
export const RecordEstimateDecisionSchema = z.object({
  decision: ApprovalDecisionSchema,
  signerName: z.string().min(1).max(255),
  method: SignatureMethodSchema,
  note: z.string().max(1000).optional(),
});
export type RecordEstimateDecision = z.infer<typeof RecordEstimateDecisionSchema>;

export const EstimateItemSchema = estimateItemInput.extend({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  estimateId: z.string().uuid(),
  total: z.number(),
  sortOrder: z.number().int(),
  createdAt: z.date(),
});
export type EstimateItem = z.infer<typeof EstimateItemSchema>;

export const EstimateApprovalSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  estimateId: z.string().uuid(),
  decision: ApprovalDecisionSchema,
  signerName: z.string(),
  method: SignatureMethodSchema,
  approvedByUserId: z.string().uuid().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  metadata: z.unknown().optional(),
  signedAt: z.date(),
});
export type EstimateApproval = z.infer<typeof EstimateApprovalSchema>;
