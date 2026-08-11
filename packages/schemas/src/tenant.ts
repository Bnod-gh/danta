import { z } from 'zod';

export const TenantStatusSchema = z.enum(['pending', 'active', 'suspended', 'deactivated']);

export type TenantStatus = z.infer<typeof TenantStatusSchema>;

export const OrganisationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  legalName: z.string().optional(),
  abn: z.string().optional(),
  status: TenantStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Organisation = z.infer<typeof OrganisationSchema>;

export const CreateOrganisationSchema = z.object({
  name: z.string().min(1).max(255),
  legalName: z.string().optional(),
  abn: z.string().optional(),
});

export type CreateOrganisation = z.infer<typeof CreateOrganisationSchema>;

export const PracticeSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  organisationId: z.string().uuid(),
  name: z.string().min(1).max(255),
  status: TenantStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Practice = z.infer<typeof PracticeSchema>;

export const CreatePracticeSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(255),
});

export type CreatePractice = z.infer<typeof CreatePracticeSchema>;

export const LocationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  practiceId: z.string().uuid(),
  name: z.string().min(1).max(255),
  address: z.string().optional(),
  phone: z.string().optional(),
  timezone: z.string().default('Australia/Adelaide'),
  status: TenantStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Location = z.infer<typeof LocationSchema>;

export const CreateLocationSchema = z.object({
  tenantId: z.string().uuid(),
  practiceId: z.string().uuid(),
  name: z.string().min(1).max(255),
  address: z.string().optional(),
  phone: z.string().optional(),
  timezone: z.string().default('Australia/Adelaide'),
});

export type CreateLocation = z.infer<typeof CreateLocationSchema>;

export * from './common';
