import { z } from 'zod';

export const ProcedureCodeCategorySchema = z.enum([
  'Diagnostic',
  'Preventive',
  'Restorative',
  'Endodontics',
  'Implants',
  'Oral Surgery',
  'Orthodontics',
  'Adjunctive',
]);

export const ProcedureCodeSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  description: z.string(),
  category: z.string(),
  defaultFee: z.number(),
  isActive: z.boolean(),
});

export type ProcedureCode = z.infer<typeof ProcedureCodeSchema>;

export const ProcedureCodeQuerySchema = z.object({
  category: z.string().max(100).optional(),
  search: z.string().max(100).optional(),
});

export type ProcedureCodeQuery = z.infer<typeof ProcedureCodeQuerySchema>;
