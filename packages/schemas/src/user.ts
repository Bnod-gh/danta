import { z } from 'zod';
import { PaginationSchema, PaginatedResponseSchema } from './common';

export const UserRoleSchema = z.enum([
  'superadmin',
  'platform_owner',
  'platform_admin',
  'organisation_owner',
  'practice_manager',
  'dentist',
  'specialist',
  'hygienist',
  'dental_therapist',
  'dental_assistant',
  'receptionist',
  'billing_officer',
  'finance',
  'read_only',
]);

export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserStatusSchema = z.enum(['pending', 'active', 'suspended', 'deactivated']);

export type UserStatus = z.infer<typeof UserStatusSchema>;

export const CreateUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
  role: UserRoleSchema,
  password: z.string().min(12).max(128),
  tenantId: z.string().uuid(),
  practiceId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
});

export type CreateUser = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true });

export type UpdateUser = z.infer<typeof UpdateUserSchema>;

export const UserQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  role: UserRoleSchema.optional(),
  status: UserStatusSchema.optional(),
  practiceId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
});

export type UserQuery = z.infer<typeof UserQuerySchema>;

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().optional(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  tenantId: z.string().uuid(),
  practiceId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastLoginAt: z.date().optional(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

export const UsersResponseSchema = PaginatedResponseSchema(UserResponseSchema);

export type UsersResponse = z.infer<typeof UsersResponseSchema>;

export * from './common';
