import { z } from 'zod';

export const SettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.record(z.any()),
});

export type Setting = z.infer<typeof SettingSchema>;

export const SettingsResponseSchema = z.array(SettingSchema);

export type SettingsResponse = z.infer<typeof SettingsResponseSchema>;
