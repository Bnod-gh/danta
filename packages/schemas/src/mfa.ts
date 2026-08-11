import { z } from 'zod';

export const MFASetupSchema = z.object({
  type: z.enum(['totp', 'sms', 'email']).default('totp'),
});

export type MFASetup = z.infer<typeof MFASetupSchema>;

export const MFAVerifySchema = z.object({
  code: z.string().min(6).max(8),
});

export type MFAVerify = z.infer<typeof MFAVerifySchema>;

export const MFASecretSchema = z.object({
  secret: z.string(),
  qrCode: z.string().optional(),
});

export type MFASecret = z.infer<typeof MFASecretSchema>;

export const MFADisableSchema = z.object({
  code: z.string().min(6).max(8),
});

export type MFADisable = z.infer<typeof MFADisableSchema>;

export const MFABackupCodesSchema = z.object({
  backupCodes: z.array(z.string()),
});

export type MFABackupCodes = z.infer<typeof MFABackupCodesSchema>;
