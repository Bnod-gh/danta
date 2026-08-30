import { z } from 'zod';

export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(100),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

export const PatientSearchResultSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  patientNumber: z.string(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

export const ProviderSearchResultSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable().optional(),
});

export const ServiceSearchResultSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
});

export const AppointmentTypeSearchResultSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string().nullable().optional(),
  duration: z.number().int(),
});

export const SearchResultsSchema = z.object({
  patients: z.array(PatientSearchResultSchema),
  providers: z.array(ProviderSearchResultSchema),
  services: z.array(ServiceSearchResultSchema),
  appointmentTypes: z.array(AppointmentTypeSearchResultSchema),
});

export type SearchResults = z.infer<typeof SearchResultsSchema>;
export type PatientSearchResult = z.infer<typeof PatientSearchResultSchema>;
export type ProviderSearchResult = z.infer<typeof ProviderSearchResultSchema>;
export type ServiceSearchResult = z.infer<typeof ServiceSearchResultSchema>;
export type AppointmentTypeSearchResult = z.infer<typeof AppointmentTypeSearchResultSchema>;
