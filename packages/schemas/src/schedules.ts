import { z } from 'zod';

export const ScheduleOverrideTypeSchema = z.enum(['time_off', 'custom_hours']);

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

const timeString = z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, 'Expected HH:mm');

// --- Provider shifts (weekly template) ---

export const ProviderShiftSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  providerId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: timeString,
  endTime: timeString,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProviderShift = z.infer<typeof ProviderShiftSchema>;

export const CreateProviderShiftSchema = z
  .object({
    providerId: z.string().uuid(),
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: timeString,
    endTime: timeString,
  })
  .refine((shift) => shift.startTime < shift.endTime, {
    message: 'Start time must be before end time',
  });

export type CreateProviderShift = z.infer<typeof CreateProviderShiftSchema>;

export const UpdateProviderShiftSchema = CreateProviderShiftSchema.innerType()
  .extend({ providerId: z.string().uuid().optional() })
  .partial();

export type UpdateProviderShift = z.infer<typeof UpdateProviderShiftSchema>;

// --- Schedule overrides (date-specific exceptions) ---

export const ScheduleOverrideSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  providerId: z.string().uuid(),
  date: z.coerce.date(),
  type: ScheduleOverrideTypeSchema,
  isFullDay: z.boolean(),
  startTime: timeString.optional(),
  endTime: timeString.optional(),
  reason: z.string().max(255).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ScheduleOverride = z.infer<typeof ScheduleOverrideSchema>;

export const CreateScheduleOverrideSchema = z
  .object({
    providerId: z.string().uuid(),
    date: z.coerce.date(),
    type: ScheduleOverrideTypeSchema.default('time_off'),
    isFullDay: z.boolean().default(true),
    startTime: timeString.optional(),
    endTime: timeString.optional(),
    reason: z.string().max(255).optional(),
  })
  .refine((override) => override.isFullDay ? !override.startTime && !override.endTime : !!override.startTime && !!override.endTime && override.startTime < override.endTime, {
    message: 'Partial-day overrides require start and end times (start before end); full-day overrides take none',
  })
  .refine((override) => override.type !== 'custom_hours' || (!!override.startTime && !!override.endTime), {
    message: 'Custom-hours overrides require start and end times',
  });

export type CreateScheduleOverride = z.infer<typeof CreateScheduleOverrideSchema>;

export const UpdateScheduleOverrideSchema = z.object({
  date: z.coerce.date().optional(),
  type: ScheduleOverrideTypeSchema.optional(),
  isFullDay: z.boolean().optional(),
  startTime: timeString.optional(),
  endTime: timeString.optional(),
  reason: z.string().max(255).optional(),
});

export type UpdateScheduleOverride = z.infer<typeof UpdateScheduleOverrideSchema>;

// --- Free-slot search ---

export const FreeSlotQuerySchema = z.object({
  providerId: z.string().uuid(),
  date: z.coerce.date(),
  durationMin: z.coerce.number().int().min(5).max(480).default(30),
  stepMin: z.coerce.number().int().min(5).max(60).default(15),
});

export type FreeSlotQuery = z.infer<typeof FreeSlotQuerySchema>;

export type FreeSlot = {
  startTime: string;
  endTime: string;
};

export type WorkingWindow = {
  startMinutes: number;
  endMinutes: number;
};
