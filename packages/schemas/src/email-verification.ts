import { z } from 'zod';

export const VerifyEmailSchema = z.object({
  token: z.string().min(1),
});

export type VerifyEmail = z.infer<typeof VerifyEmailSchema>;

export const ResendVerificationSchema = z.object({
  email: z.string().email(),
});

export type ResendVerification = z.infer<typeof ResendVerificationSchema>;
