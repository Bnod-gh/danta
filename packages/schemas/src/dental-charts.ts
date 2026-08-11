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
