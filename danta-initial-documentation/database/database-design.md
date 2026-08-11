# Database Design

## 1. Principles

- PostgreSQL is authoritative.
- Prisma owns database mapping.
- Tenant isolation is explicit.
- Foreign keys are mandatory for relational integrity.
- Financial records require strong constraints and transactions.
- Clinical records require version/history preservation.
- Large files stay outside PostgreSQL.
- Index according to real query patterns.

## 2. Core entities

### Tenancy

- Organisation
- Practice
- Location

### Identity

- User
- UserSession
- MFAFactor
- Invitation
- Role
- Permission
- UserRole
- RolePermission

### Patient

- Patient
- PatientContact
- PatientAddress
- EmergencyContact
- PatientRelationship
- PatientConsent
- MedicalHistory
- Allergy
- Medication
- PatientAlert
- PatientPreference

### Scheduling

- Appointment
- AppointmentType
- AppointmentStatusHistory
- ProviderAvailability
- Chair
- Room
- CalendarResource

### Clinical

- ClinicalNote
- ClinicalNoteVersion
- ClinicalNoteTemplate
- Diagnosis
- Procedure
- Referral
- Prescription
- PeriodontalRecord

### Dental

- DentalChart
- Tooth
- ToothFinding
- ToothTreatment
- ToothSurface

### Treatment

- TreatmentPlan
- TreatmentPlanItem
- TreatmentPlanVersion
- TreatmentAcceptance

### Imaging

- ImagingStudy
- ImagingAsset
- ImagingMetadata

### Billing

- FeeSchedule
- Invoice
- InvoiceItem
- CreditNote
- Payment
- PaymentAllocation
- Refund

### Claims

- Claim
- ClaimItem
- ClaimTransaction
- EligibilityCheck

### Communication

- Communication
- MessageTemplate
- Notification
- DeliveryAttempt
- CommunicationPreference

### Recall

- RecallRule
- Recall
- RecallAttempt

### Audit

- AuditLog

### Integration

- Integration
- IntegrationCredentialReference
- WebhookEndpoint
- WebhookDelivery
- ExternalTransaction

### SaaS

- Plan
- Subscription
- Entitlement
- UsageRecord

## 3. Common columns

Tenant-owned entities should generally have:

```text
id
tenantId
createdAt
updatedAt
createdBy
updatedBy
```

Use soft deletion only where domain-appropriate.

Do not blindly add `deletedAt` to immutable clinical/financial entities.

## 4. Monetary fields

Use:

```text
Decimal / NUMERIC
```

Examples:

- amount
- unitPrice
- discount
- tax
- balance

Never store monetary values as JavaScript floating point.

## 5. Dates

Prefer:

- `timestamptz` for instants
- explicit practice/location timezone configuration
- date-only fields for DOB, recall dates, etc.

Do not assume server timezone is the practice timezone.

## 6. Important indexes

Patients:
- `(tenantId, patientNumber)`
- `(tenantId, normalizedName)`
- `(tenantId, dateOfBirth)`
- `(tenantId, normalizedPhone)`
- `(tenantId, normalizedEmail)`

Appointments:
- `(tenantId, locationId, startAt)`
- `(tenantId, practitionerId, startAt)`
- `(tenantId, patientId, startAt)`
- `(tenantId, status, startAt)`

Clinical:
- `(tenantId, patientId, createdAt)`

Invoices:
- `(tenantId, patientId, status)`
- `(tenantId, issuedAt)`

Payments:
- `(tenantId, invoiceId)`
- `(tenantId, transactionDate)`

Claims:
- `(tenantId, patientId, status)`
- `(tenantId, createdAt)`

## 7. Constraints

Use database constraints for:

- foreign keys
- unique identifiers
- valid status relationships where practical
- non-negative quantities where appropriate
- tenant-safe uniqueness
- external transaction uniqueness
- idempotency keys

Application validation is not a replacement for database integrity.

## 8. Clinical history

Signed notes should have immutable versions.

```text
ClinicalNote
  └── ClinicalNoteVersion
       ├── author
       ├── signedAt
       ├── content
       └── amendmentReason
```

## 9. Financial history

Do not mutate financial history to "fix" it.

Use:

- credit notes
- refunds
- adjustments
- reversals

as appropriate.

## 10. ERD implementation

Before production migrations, create an ERD from the Prisma schema and review:

- ownership
- tenant boundaries
- cardinality
- deletion behaviour
- indexes
- uniqueness
- audit implications
