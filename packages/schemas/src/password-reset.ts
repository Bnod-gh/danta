import { z } from 'zod';

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export type ForgotPassword = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(12).max(128),
});

export type ResetPassword = z.infer<typeof ResetPasswordSchema>;
