import { z } from 'zod';

export const PatientRelationshipTypeSchema = z.enum([
  'parent',
  'child',
  'spouse',
  'sibling',
  'guardian',
  'ward',
  'other',
]);

export type PatientRelationshipType = z.infer<typeof PatientRelationshipTypeSchema>;

/// Inverse label derived at read time so the two sides of a pair never
/// drift apart (DentalPin pattern).
export const INVERSE_RELATIONSHIP_TYPE: Record<PatientRelationshipType, PatientRelationshipType> = {
  parent: 'child',
  child: 'parent',
  spouse: 'spouse',
  sibling: 'sibling',
  guardian: 'ward',
  ward: 'guardian',
  other: 'other',
};

export const PatientRelationshipSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  relatedPatientId: z.string().uuid(),
  type: PatientRelationshipTypeSchema,
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PatientRelationship = z.infer<typeof PatientRelationshipSchema>;

export const PatientRelationshipViewSchema = PatientRelationshipSchema.extend({
  /// How the related patient is described to this patient (e.g. "Mother").
  relationshipLabel: z.string(),
  inverseType: PatientRelationshipTypeSchema,
  relatedPatient: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    patientNumber: z.string(),
  }),
});

export type PatientRelationshipView = z.infer<typeof PatientRelationshipViewSchema>;

export const CreatePatientRelationshipSchema = z.object({
  relatedPatientId: z.string().uuid(),
  type: PatientRelationshipTypeSchema.default('other'),
  notes: z.string().max(500).optional(),
});

export type CreatePatientRelationship = z.infer<typeof CreatePatientRelationshipSchema>;

export const UpdatePatientRelationshipSchema = z.object({
  type: PatientRelationshipTypeSchema.optional(),
  notes: z.string().max(500).optional(),
});

export type UpdatePatientRelationship = z.infer<typeof UpdatePatientRelationshipSchema>;

export function describeRelationship(type: PatientRelationshipType): string {
  const labels: Record<PatientRelationshipType, [string, string]> = {
    parent: ['Parent', 'Child'],
    child: ['Child', 'Parent'],
    spouse: ['Spouse', 'Spouse'],
    sibling: ['Sibling', 'Sibling'],
    guardian: ['Guardian', 'Ward'],
    ward: ['Ward', 'Guardian'],
    other: ['Related', 'Related'],
  };
  return labels[type][0];
}
