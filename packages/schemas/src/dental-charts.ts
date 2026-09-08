import { z } from 'zod';

export const DentalChartSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  chartDate: z.date(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DentalChart = z.infer<typeof DentalChartSchema>;

export const CreateDentalChartSchema = z.object({
  patientId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
});

export type CreateDentalChart = z.infer<typeof CreateDentalChartSchema>;

export const UpdateDentalChartSchema = z.object({
  notes: z.string().max(1000).optional(),
});

export type UpdateDentalChart = z.infer<typeof UpdateDentalChartSchema>;

export const GeneratePlanFromChartSchema = z.object({
  providerId: z.string().uuid().optional(),
});

export type GeneratePlanFromChart = z.infer<typeof GeneratePlanFromChartSchema>;

export const ChartPlanLineSchema = z.object({
  condition: z.string(),
  label: z.string(),
  toothNumber: z.string(),
  surface: z.string().nullable().optional(),
  code: z.string(),
  description: z.string(),
  defaultFee: z.number(),
});

export type ChartPlanLine = z.infer<typeof ChartPlanLineSchema>;

export const GeneratePlanFromChartResponseSchema = z.object({
  plan: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
  items: z.array(ChartPlanLineSchema),
  estimatedTotal: z.number(),
});

export type GeneratePlanFromChartResponse = z.infer<typeof GeneratePlanFromChartResponseSchema>;
