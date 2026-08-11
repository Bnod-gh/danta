import { z } from 'zod';
import { UserRoleSchema } from './user';

export const InvitationResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: UserRoleSchema,
  expiresAt: z.date(),
  acceptedAt: z.date().optional(),
  createdAt: z.date(),
});

export type InvitationResponse = z.infer<typeof InvitationResponseSchema>;

export const AcceptInvitationSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(12).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});

export type AcceptInvitation = z.infer<typeof AcceptInvitationSchema>;
