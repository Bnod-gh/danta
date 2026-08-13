# Danta Initial Documentation


This file contains all documentation from the initial Danta project setup.


---

## api\api-standards.md


# API Standards

## REST

Use predictable resource-oriented REST APIs.

Examples:

```text
GET    /api/v1/patients
POST   /api/v1/patients
GET    /api/v1/patients/:id
PATCH  /api/v1/patients/:id

GET    /api/v1/appointments
POST   /api/v1/appointments
PATCH  /api/v1/appointments/:id
```

## Versioning

Initial API:

```text
/api/v1
```

## Response structure

Use consistent responses.

List:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 0
  }
}
```

Single resource:

```json
{
  "data": {}
}
```

## Errors

Example:

```json
{
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "Patient not found",
    "requestId": "..."
  }
}
```

Do not expose stack traces or database errors.

## Validation

Request validation uses shared Zod schemas and nestjs-zod.

## Pagination

Support consistent:

- page/pageSize initially
- cursor pagination for large/high-frequency collections when useful

## Filtering

Use explicit query schemas.

Example:

```text
?status=ACTIVE&locationId=...&from=...&to=...
```

Never build arbitrary SQL/order clauses directly from user input.

## Sorting

Whitelist sortable fields.

## Idempotency

Support `Idempotency-Key` for critical mutations such as:

- payment
- claim
- external integration submission
- webhook-triggered writes

## Swagger

Document:

- operation
- parameters
- body
- response
- auth
- error codes

Swagger should be protected appropriately in production.

## Correlation IDs

Accept/generate a request ID and propagate it through:

- logs
- jobs
- integrations
- audit
- webhook delivery




---

## architecture\decisions.md


# Architecture Decision Records

## ADR-001 â€” Turborepo monorepo

Decision:
Use Turborepo with pnpm workspaces.

Reason:
- Shared schemas
- Shared UI
- Shared auth/permission types
- Independent app builds
- Incremental task caching
- Clear application/package boundaries

## ADR-002 â€” PostgreSQL is authoritative

Decision:
PostgreSQL is the source of truth for business data.

Redis is not authoritative.

## ADR-003 â€” Zod is contract source

Decision:
Use Zod as the primary validation/schema source shared between frontend and backend.

Use nestjs-zod for NestJS integration.

Avoid manually duplicated validation DTO definitions.

## ADR-004 â€” Prisma

Decision:
Use Prisma for persistence.

Business logic must not depend directly on Prisma models outside data-access boundaries.

## ADR-005 â€” TanStack

Decision:
- TanStack Router for routing
- TanStack Query for server state
- TanStack Form for forms
- TanStack Table for data tables

Avoid unnecessary `useEffect` for server state.

## ADR-006 â€” shadcn/ui

Decision:
Use shadcn/ui primitives and build Danta domain components on top.

Do not tightly fork primitives unless required.

## ADR-007 â€” Integration adapters

Decision:
HICAPS, Medicare, Tyro, SMS, email and imaging integrations use provider interfaces/adapters.

## ADR-008 â€” Object storage

Decision:
Large files such as X-rays and documents belong in object storage. PostgreSQL stores metadata.

## ADR-009 â€” Async processing

Decision:
Redis-backed queues are used for work that does not need to complete inside the request transaction.

## ADR-010 â€” Clinical record immutability

Decision:
Signed clinical records are not silently overwritten. Amendments preserve history.

## ADR-011 â€” Money

Decision:
Use PostgreSQL numeric/decimal for monetary values. Never use floating-point arithmetic for financial amounts.

## ADR-012 â€” Authorization

Decision:
Use RBAC plus resource/policy authorization (RBA-style policy checks). Roles alone are insufficient.




---

## architecture\domain-architecture.md


# Danta Domain Architecture

## Core domains

1. Platform
2. Tenancy
3. Identity
4. Authorization
5. Patient
6. Scheduling
7. Clinical
8. Dental Chart
9. Treatment Planning
10. Imaging
11. Documents
12. Billing
13. Payments
14. Claims
15. Recall
16. Communication
17. Inventory
18. Reporting
19. Audit
20. Integrations
21. SaaS Subscription

## Dependency direction

```text
Platform
  â†“
Tenancy
  â†“
Identity / Authorization
  â†“
Patient
  â”œâ”€â”€ Scheduling
  â”œâ”€â”€ Clinical
  â”œâ”€â”€ Dental Chart
  â”œâ”€â”€ Treatment Planning
  â”œâ”€â”€ Imaging
  â”œâ”€â”€ Documents
  â”œâ”€â”€ Billing
  â”œâ”€â”€ Claims
  â””â”€â”€ Recall

Billing
  â”œâ”€â”€ Payments
  â””â”€â”€ Claims

Communication
  â””â”€â”€ Recall/Scheduling

Integrations
  â””â”€â”€ Billing/Claims/Imaging/Communication

Reporting
  â””â”€â”€ read-oriented projections/queries
```

## Domain rules

- Domains own their business rules.
- Do not let controllers directly manipulate another domain's database records.
- Cross-domain workflows use application services/domain events.
- Avoid circular dependencies.
- Prefer explicit interfaces between integration domains.

## Initial module structure

```text
apps/api/src/modules/
  auth/
  tenants/
  organisations/
  practices/
  locations/
  users/
  permissions/
  patients/
  appointments/
  calendar/
  clinical/
  dental-chart/
  treatment-plans/
  imaging/
  documents/
  billing/
  payments/
  claims/
  hicaps/
  medicare/
  recalls/
  communications/
  inventory/
  reports/
  notifications/
  integrations/
  audit/
  api-keys/
  subscriptions/
  settings/
```

## Vertical slices

Each module should be implemented as a complete slice:

```text
schema
  â†“
DTO
  â†“
authorization
  â†“
controller
  â†“
application service
  â†“
repository
  â†“
database
  â†“
tests
  â†“
audit
```

Do not build the entire database first and postpone business logic.




---

## architecture\multi-tenancy.md


# Multi-Tenancy Strategy

## 1. Tenant hierarchy

```text
Platform
  â””â”€â”€ Organisation
       â””â”€â”€ Practice
            â””â”€â”€ Location
                 â””â”€â”€ Users / Patients / Clinical data
```

For the initial SaaS model, `tenantId` should represent the security boundary.

An organisation may contain multiple practices/locations depending on product configuration.

## 2. Tenant isolation

Every tenant-owned record must have an explicit tenant relationship.

The server determines tenant context from authenticated identity/session.

Never trust:

- tenantId from request body
- tenantId from query string
- tenantId from hidden form fields
- tenantId from client state

## 3. Access pattern

Every data access operation must enforce tenant scope.

Bad:

```ts
findPatient(id)
```

Preferred conceptual operation:

```ts
findPatient({
  tenantId,
  patientId,
})
```

Repository methods should make tenant scoping difficult to forget.

## 4. Resource scope

A resource may additionally be scoped to:

- practice
- location
- department
- practitioner

Authorization evaluates both tenant and resource scope.

## 5. Cross-tenant protection

Tests must include:

- Tenant A reading Tenant B patient
- Tenant A updating Tenant B appointment
- Tenant A deleting Tenant B invoice
- Tenant A guessing another tenant resource ID
- Tenant A using another tenant API key

Expected result should be an appropriate `403` or `404` according to the endpoint's disclosure policy.

## 6. IDs

Use opaque IDs such as UUID/UUIDv7 or another non-sequential strategy where useful.

IDs are not authorization.

Even if IDs are impossible to guess, authorization is still mandatory.

## 7. Database constraints

Foreign keys should preserve tenant relationships where practical.

For important composite relationships, consider composite unique constraints including `tenantId`.

Example:

```text
@@unique([tenantId, patientNumber])
```

## 8. Future isolation

The architecture should allow a future move from shared PostgreSQL tables to stronger isolation if required.

Potential future models:

- shared database/shared schema with tenant keys
- database-per tenant
- schema-per tenant

Do not prematurely implement database-per-tenant.




---

## architecture\system-architecture.md


# Danta System Architecture

## 1. Goals

Danta must be:

- Multi-tenant by design
- Secure for sensitive health information
- Transactionally reliable
- Fast for clinical workflows
- Modular enough to support integrations
- Easy to test and evolve
- Suitable for SaaS and multi-location practices

## 2. High-level architecture

```text
                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                    â”‚      Browser        â”‚
                    â”‚ React + TanStack    â”‚
                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                               â”‚ HTTPS
                               â–¼
                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                    â”‚      NestJS API     â”‚
                    â”‚ Auth / API / Domain â”‚
                    â””â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜
                            â”‚     â”‚
               â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
               â–¼                                  â–¼
        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                 â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â”‚  PostgreSQL   â”‚                 â”‚    Redis     â”‚
        â”‚ Source of     â”‚                 â”‚ Cache/Queue/ â”‚
        â”‚ truth         â”‚                 â”‚ Locks/Rate   â”‚
        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                 â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜
                                                 â”‚
                                                 â–¼
                                         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                                         â”‚ Worker        â”‚
                                         â”‚ BullMQ/jobs   â”‚
                                         â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                                â”‚
                         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                         â–¼                      â–¼                    â–¼
                    Object Storage         Email/SMS            External PMS
                    Imaging/Documents      Providers            Integrations
                                                                  HICAPS
                                                                  Medicare
                                                                  Tyro
```

## 3. Monorepo

Use Turborepo + pnpm.

```text
apps/
  api/
  web/
  worker/

packages/
  schemas/
  database/
  auth/
  permissions/
  ui/
  config/
```

### Apps

`apps/api`
- NestJS HTTP API
- authentication
- authorization
- business workflows

`apps/web`
- React/Vite
- TanStack Router
- TanStack Query/Form/Table
- shadcn/ui

`apps/worker`
- asynchronous jobs
- reminders
- communication
- report generation
- webhook delivery
- integration polling
- image processing orchestration

### Packages

`packages/schemas`
- Zod schemas
- shared request/query/response contracts
- inferred TypeScript types

`packages/database`
- Prisma schema/client
- database utilities

`packages/auth`
- shared auth types and utilities

`packages/permissions`
- permission constants
- policy definitions
- authorization helpers

`packages/ui`
- Danta-specific UI components built on shadcn/ui

`packages/config`
- shared TypeScript/ESLint/build conventions where appropriate

## 4. Request flow

```text
HTTP request
  â†“
Authentication
  â†“
Tenant context
  â†“
Input validation
  â†“
Authorization policy
  â†“
Controller
  â†“
Application service
  â†“
Domain/business rules
  â†“
Repository/data access
  â†“
Prisma/PostgreSQL
  â†“
Audit/event where required
  â†“
Response
```

Controllers must remain thin.

## 5. Source of truth

PostgreSQL:
- authoritative business data

Zod:
- validation/API contract source

Prisma:
- persistence mapping

Redis:
- infrastructure state only

Object storage:
- binary files

Frontend:
- presentation and client state, never authorization source

## 6. Integration boundary

External systems must be adapters.

```text
Danta domain
    â†“
Internal provider interface
    â†“
Adapter
    â†“
External provider
```

Never scatter HICAPS/Medicare/Tyro-specific logic through billing or clinical modules.

## 7. Security boundary

Every protected request must establish:

- authenticated principal
- tenant context
- practice/location scope where applicable
- permission
- resource ownership/access policy

Frontend permissions are UX only.

Backend authorization is mandatory.




---

## billing\billing-architecture.md


# Billing and Payments Architecture

## Separation

Two billing domains exist:

1. Danta SaaS subscription billing
2. Dental patient billing

Keep them completely separate.

## Patient billing

Entities:

- FeeSchedule
- Invoice
- InvoiceItem
- CreditNote
- Payment
- PaymentAllocation
- Refund

## Invoice lifecycle

```text
Draft
 â†“
Issued
 â†“
Partially Paid
 â†“
Paid
```

Alternative:

- voided
- written off
- refunded

## Financial integrity

Use database transactions.

Example:

```text
Payment request
 â†“
idempotency check
 â†“
provider transaction
 â†“
payment record
 â†“
allocation
 â†“
balance
 â†“
audit
```

## Money

Use Decimal/NUMERIC.

Never:

```ts
number + number
```

for authoritative financial calculations where precision matters.

## Payment providers

Use:

```text
PaymentProvider
```

Potential adapters:

- HICAPS
- Tyro
- Stripe
- EFTPOS
- bank transfer
- cash

## Refunds

Do not delete a payment.

Create a refund/reversal record.

## Reconciliation

Support:

- provider transaction
- internal payment
- invoice
- claim
- reconciliation status

## Patient statements

Generate statements from authoritative billing records.

## GST/tax

Do not hard-code tax assumptions.

Create configurable tax treatment and validate Australian tax requirements with accounting/tax professionals.

## Idempotency

Payments must support idempotency.

External transaction IDs must be unique per provider where applicable.




---

## calendar\calendar-architecture.md


# Calendar Architecture

## Requirements

Views:

- day
- week
- multi-day
- month

Resources:

- practitioner
- chair
- room
- location

## Appointment

Core fields:

- patient
- practitioner
- location
- resource/chair
- type
- start
- end
- status
- notes
- confirmation
- check-in

## Status lifecycle

```text
Booked
  â†“
Confirmed
  â†“
Arrived
  â†“
In Chair
  â†“
Completed
```

Alternative states:

- Cancelled
- Did Not Attend
- Rescheduled

## Conflict handling

Before booking or moving:

- validate provider availability
- validate chair/resource availability
- validate location
- validate appointment duration
- enforce tenant scope

## Drag/drop

Drag/drop must trigger server-side validation.

Do not assume the browser move is valid.

## Time zones

Practice/location timezone is authoritative for calendar display.

Store instants correctly and convert for display.

## Recurring appointments

Design for recurrence but implement carefully.

Do not create unbounded future appointments automatically.

Use recurrence rules and materialize only the required window where appropriate.

## Reminders

Appointment reminder jobs are asynchronous.

Use idempotent job keys to avoid duplicate reminders.




---

## clinical\clinical-architecture.md


# Clinical Architecture

## 1. Dental chart

Support:

- FDI numbering
- adult dentition
- primary dentition
- surfaces
- conditions
- restorations
- missing teeth
- implants
- crowns
- bridges
- endodontic treatment
- extraction
- dentures
- periodontal data

## 2. Tooth model

A tooth can have:

- anatomical number
- dentition type
- status
- findings
- treatments
- notes
- imaging associations

Surface-level findings should be separate where required.

## 3. Chart states

Distinguish:

- current/observed
- planned
- completed
- historical

Do not overwrite historical clinical state.

## 4. Clinical notes

Support:

- templates
- structured sections
- free text
- draft
- signed
- amended

Signed notes must be versioned.

## 5. Treatment plans

Statuses:

- draft
- presented
- accepted
- partially accepted
- rejected
- expired
- completed
- cancelled

Treatment items include:

- procedure/item code
- tooth
- surface
- provider
- fee
- discount
- patient estimate
- health fund estimate
- gap
- status

## 6. Clinical workflow

```text
Patient
 â†“
Appointment
 â†“
Clinical encounter
 â†“
Assessment
 â†“
Chart update
 â†“
Treatment plan
 â†“
Treatment
 â†“
Clinical note
 â†“
Billing
```

## 7. Clinical integrity

Never silently modify a signed record.

Use amendments.

## 8. Access

Clinical access is more restricted than demographic access.

Authorization should be explicit.

## 9. Clinical templates

Templates should be versioned so historical notes remain understandable even if a template changes later.

## 10. Future clinical extensions

Architecture should allow:

- periodontal charting
- orthodontics
- oral surgery
- endodontics
- prosthodontics
- specialist workflows
- clinical decision support
- AI-assisted documentation

AI features must not silently generate or alter clinical records.




---

## database\database-design.md


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
  â””â”€â”€ ClinicalNoteVersion
       â”œâ”€â”€ author
       â”œâ”€â”€ signedAt
       â”œâ”€â”€ content
       â””â”€â”€ amendmentReason
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




---

## deployment\deployment.md


# Deployment Architecture

## Target

Containerized deployment.

Danta should be deployable using Docker and suitable for Coolify or another container platform.

## Services

Minimum:

```text
danta-api
danta-web
danta-worker
postgres
redis
```

External:

- object storage
- email provider
- SMS provider
- payment/integration providers

## Environments

- local
- development
- staging
- production

Never share production secrets with local development.

## Containers

Each application should have a production Dockerfile.

Use multi-stage builds where useful.

## Database

Production PostgreSQL must have:

- backups
- monitoring
- connection limits
- migration process
- restore testing

## Prisma migrations

Production:

```text
prisma migrate deploy
```

Never use development reset commands against production.

## Health endpoints

API:

```text
/health
/health/ready
```

Readiness should check dependencies required for the application to operate.

## Observability

Monitor:

- API latency
- error rates
- DB connections
- DB latency
- Redis
- worker failures
- queue depth
- storage errors
- external integration failures

## Secrets

Use platform secret/environment mechanisms.

Never commit `.env` secrets.

## Backups

Backup:

- PostgreSQL
- critical object storage metadata/files according to storage strategy

Test restoration.

## Zero/low downtime migrations

Database changes should be backward compatible where possible.

Use expand/contract migrations for risky changes.




---

## development\ai-development-rules.md


# AI-Assisted Development Rules

## Before coding

The AI agent must:

1. inspect the repository
2. inspect package boundaries
3. inspect existing schemas
4. inspect Prisma
5. inspect API conventions
6. inspect frontend conventions
7. inspect authorization
8. inspect tests
9. identify impacted modules
10. propose a small implementation plan

## Scope control

Do not modify unrelated modules.

Do not rewrite working architecture merely for stylistic preference.

Do not introduce dependencies without justification.

## Schema-first

When adding a request contract:

```text
Zod schema
 â†“
inferred type
 â†“
nestjs-zod DTO
 â†“
API
 â†“
frontend form/query
```

## Database-first is not enough

A Prisma model does not constitute a feature.

Complete the vertical slice.

## Security

For every endpoint ask:

- Who can call it?
- Which tenant?
- Which practice?
- Which location?
- Which resource?
- Which state?
- Is the operation auditable?

## External APIs

If official provider documentation is unavailable:

- create an interface
- create a mock/sandbox adapter
- document assumptions
- do not invent production endpoints

## Testing

Every bug fix should include a regression test where practical.

## Migration safety

Before schema changes:

- identify existing data
- assess migration compatibility
- define rollback/recovery strategy
- test migration

## Output format for coding tasks

Before implementation, provide:

### Goal
### Scope
### Files/modules affected
### Database changes
### API changes
### UI changes
### Security impact
### Tests
### Migration notes

Then implement.

## Do not

- bypass authorization to make UI work
- use `any` to silence architectural problems
- duplicate schemas unnecessarily
- use Redis as a database
- place Prisma calls in controllers
- trust client tenant IDs
- trust client roles
- silently overwrite signed clinical records




---

## frontend\frontend-architecture.md


# Frontend Architecture

## Stack

- React
- Vite
- TypeScript
- TanStack Router
- TanStack Query
- TanStack Form
- TanStack Table
- Zod
- shadcn/ui
- Tailwind CSS

## State ownership

### Server state

TanStack Query.

Examples:

- patients
- appointments
- invoices
- clinical records

### URL state

TanStack Router.

Examples:

- patient ID
- calendar date
- filters
- search
- pagination

### Form state

TanStack Form + Zod.

### Local UI state

React state for transient UI concerns.

Do not create a global state store unless a real cross-cutting requirement exists.

## Routes

```text
/dashboard

/calendar

/patients
/patients/:patientId

/patients/:patientId/overview
/patients/:patientId/clinical
/patients/:patientId/chart
/patients/:patientId/treatment-plans
/patients/:patientId/imaging
/patients/:patientId/documents
/patients/:patientId/billing
/patients/:patientId/claims
/patients/:patientId/communication
/patients/:patientId/recalls

/billing
/claims
/recalls
/communications
/inventory
/reports
/staff
/settings
```

## Patient workspace

The patient page should be a persistent workspace rather than separate disconnected CRUD pages.

Header:

- patient name
- DOB
- patient number
- alerts
- next appointment
- balance
- quick actions

Navigation:

- Overview
- Clinical
- Chart
- Treatment
- Imaging
- Documents
- Billing
- Claims
- Communication
- Recalls
- History

## Query rules

Use stable query keys.

Avoid fetching large unrelated patient datasets when opening the profile.

Use route loaders/preloading only where it improves UX and is consistent with TanStack Router patterns.

## Forms

Every form must have:

- validation
- loading state
- error state
- dirty state
- accessible labels
- success feedback

## Tables

Use TanStack Table for:

- patients
- appointments
- invoices
- claims
- recalls
- staff
- reports

Use server-side pagination/filtering for large datasets.

## Error boundaries

Provide route-level and application-level error handling.

## Permission-aware UI

Hide/disable actions based on permissions for UX, but never treat this as security.




---

## imaging\imaging-architecture.md


# Imaging and X-ray Architecture

## Goals

Support:

- intraoral X-rays
- panoramic
- cephalometric
- photographs
- scans
- PDFs
- future DICOM

## Data model

```text
Patient
  â†“
ImagingStudy
  â†“
ImagingAsset
```

An asset contains metadata, not necessarily the binary itself.

## Storage

Large files go to object storage.

Database stores:

- object key
- patient
- tenant
- study
- MIME type
- size
- hash
- capture date
- device
- modality
- type
- tooth association
- uploader

## Security

Files must use:

- tenant-scoped access
- signed URLs
- short URL expiry
- authorization before URL generation
- file type validation

## Viewer

The frontend should provide:

- zoom
- pan
- rotate
- fit-to-screen
- brightness/contrast controls where appropriate
- image metadata
- tooth association
- notes

Do not alter the original image destructively.

## Local hardware

Browser-only hardware access is unreliable for many clinical devices.

Future architecture:

```text
Dental device
   â†“
Local connector/agent
   â†“
Danta API
   â†“
Object storage
   â†“
Patient imaging study
```

## DICOM readiness

Do not implement full DICOM unless required.

Create an abstraction so DICOM can be introduced without rewriting the patient/clinical model.

## Retention

Imaging retention must follow applicable clinical/legal requirements and practice policy.

Do not automatically delete imaging based solely on application-level "delete".




---

## infrastructure\redis-and-jobs.md


# Redis and Background Jobs

## Redis is not the source of truth

PostgreSQL owns authoritative business data.

Redis is used for infrastructure concerns.

## Appropriate uses

- rate limiting
- caching
- queues
- locks
- temporary tokens/state
- distributed coordination

## Worker

Use `apps/worker`.

Potential queue categories:

```text
notifications
email
sms
recalls
reports
webhooks
integration-polling
image-processing
exports
```

## Job requirements

Jobs should be:

- idempotent where possible
- retryable
- observable
- bounded
- tenant-aware
- correlation-ID aware

## Example

Appointment reminder:

```text
Appointment created
 â†“
Reminder schedule created
 â†“
Worker job
 â†“
check appointment state
 â†“
check communication preference
 â†“
send message
 â†“
record delivery
```

## Do not queue

Operations requiring immediate consistency such as:

- basic patient creation
- normal appointment transaction
- invoice creation
- atomic payment allocation

unless there is a specific reason.

## Locks

Use Redis locks only for operations that truly need distributed coordination.

Never use a Redis lock as the only guarantee of database correctness.

## Cache

Cache only data where stale data is acceptable.

Never cache sensitive patient data broadly without a clear invalidation and authorization strategy.




---

## integrations\australian-integrations.md


# Australian Integration Architecture

## Important rule

This document defines architecture boundaries, not production provider credentials/API contracts.

Do not invent undocumented provider APIs.

Official provider documentation and onboarding requirements must be used before production implementation.

## HICAPS

Treat HICAPS as an adapter.

```text
Billing/Claims
   â†“
ClaimProvider / PaymentProvider
   â†“
HICAPS adapter
   â†“
HICAPS
```

Potential capabilities:

- private health insurance claiming
- payment/EFTPOS workflow
- transaction result handling
- reconciliation
- failure/retry state

Store:

- provider
- external transaction ID
- status
- request/correlation ID
- timestamps
- safe provider metadata

Never store secrets or unnecessary sensitive payloads.

## Medicare

Create:

```text
MedicareProvider
```

Potential future operations:

- eligibility
- patient verification
- claim submission
- claim status
- reconciliation

Use official Services Australia developer requirements before production.

## DVA

Create a separate provider boundary.

Do not mix DVA rules into generic billing logic.

## Tyro

Create a payment/provider adapter.

## SMS

Create:

```text
SmsProvider
```

Possible adapters can be selected by tenant configuration.

## Email

Create:

```text
EmailProvider
```

Support templates and delivery status.

## Imaging

Imaging integrations must be abstracted.

Potential future interfaces:

- ImagingProvider
- LocalImagingConnector
- DicomProvider

## External integration state

Every integration should have:

- configuration
- enabled/disabled state
- credential reference
- health status
- last successful operation
- error status
- audit events

## Webhooks

External callbacks must be:

- authenticated
- signature-validated
- idempotent
- audited
- rate-limited where appropriate

## Retry

Retries must distinguish:

- transient errors
- permanent errors
- authentication errors
- invalid request
- provider outage

Use exponential backoff where appropriate.




---

## product\product-requirements.md


# Danta Product Requirements

## Vision

Danta is an Australian-first dental practice management platform designed to unify front-desk, clinical, billing and practice-management workflows.

## Personas

### Practice Owner
Needs:
- practice performance
- revenue
- staff
- reporting
- settings
- compliance visibility

### Practice Manager
Needs:
- calendar
- staff
- billing
- recalls
- reporting
- operational workflows

### Dentist
Needs:
- patient workspace
- clinical notes
- dental chart
- treatment plans
- imaging
- appointments

### Hygienist/Therapist
Needs:
- patient
- clinical
- periodontal
- appointment
- treatment

### Dental Assistant
Needs:
- appointments
- patient context
- clinical support
- imaging
- room/chair workflow

### Reception
Needs:
- patient registration
- calendar
- communication
- billing
- payments
- recalls

### Billing
Needs:
- invoices
- payments
- claims
- reconciliation
- reporting

### Patient
Needs:
- appointments
- forms
- treatment plans
- documents
- invoices
- communication

## MVP

MVP should include:

- tenant onboarding
- authentication
- RBAC/RBA
- patients
- calendar
- basic clinical notes
- dental chart foundation
- treatment plans
- basic billing
- audit
- dashboard

## Phase 2

- imaging
- recalls
- communication
- advanced billing
- HICAPS adapter/integration
- Medicare integration readiness
- reporting

## Phase 3

- patient portal
- mobile
- advanced imaging
- DVA
- Tyro
- inventory
- advanced analytics

## Non-functional requirements

- strong tenant isolation
- auditability
- high availability target defined before production
- fast patient search
- responsive calendar
- secure file handling
- accessibility
- observability
- automated backups




---

## roadmap\implementation-roadmap.md


# Danta Implementation Roadmap

## Phase 0 â€” Foundation

Deliver:

- Turborepo
- pnpm workspace
- NestJS API
- React/Vite web
- worker
- PostgreSQL
- Prisma
- Redis
- Docker Compose
- shared Zod schemas
- shadcn/ui
- Swagger
- CI
- lint
- typecheck
- test setup

## Phase 1 â€” Identity and SaaS

Build:

- Organisation
- Practice
- Location
- User
- Role
- Permission
- authentication
- MFA
- tenant approval
- invitations
- sessions
- audit
- API keys

Definition of done:
- cross-tenant security tests pass
- inactive users cannot access application
- unapproved tenant cannot access application

## Phase 2 â€” Patient

Build:

- patient
- contacts
- addresses
- alerts
- medical history
- allergies
- medications
- consent
- patient search
- patient workspace

## Phase 3 â€” Calendar

Build:

- appointment types
- providers
- resources/chairs
- availability
- calendar
- booking
- confirmation
- check-in
- cancellation
- rescheduling
- reminders

## Phase 4 â€” Clinical

Build:

- clinical notes
- templates
- signed/versioned notes
- dental chart
- tooth findings
- treatment history
- periodontal foundation

## Phase 5 â€” Treatment

Build:

- treatment plans
- treatment items
- acceptance
- estimates
- clinical-to-billing handoff

## Phase 6 â€” Imaging

Build:

- imaging studies
- object storage
- upload
- viewer
- metadata
- tooth association
- local connector abstraction

## Phase 7 â€” Billing

Build:

- fee schedules
- invoices
- payments
- allocations
- refunds
- credit notes
- receipts
- statements

## Phase 8 â€” Australian integrations

Build adapters and official integrations only when provider access/documentation is available:

- HICAPS
- Medicare
- DVA
- Tyro

## Phase 9 â€” Recall and communication

Build:

- recall rules
- recall queue
- SMS
- email
- templates
- reminders
- communication preferences

## Phase 10 â€” Reporting

Build:

- dashboard
- practice KPIs
- revenue
- production
- collections
- claims
- recall
- practitioner metrics

## Phase 11 â€” Patient portal

Build:

- patient authentication
- appointments
- forms
- treatment plans
- documents
- invoices
- payments
- communication

## Phase 12 â€” Advanced platform

Potential:

- multi-practice enterprise
- advanced inventory
- accounting integrations
- DICOM
- local imaging connectors
- AI-assisted documentation
- patient mobile app
- advanced analytics

## Vertical slice rule

Every phase must be delivered as working vertical slices.

Do not accept:

- database-only feature
- API-only feature
- UI-only feature

as "complete".

A feature is complete only when:

```text
DB
+ schema
+ API
+ auth
+ authorization
+ UI
+ tests
+ audit
+ documentation
```

are complete where applicable.




---

## security\audit-logging.md


# Audit Logging

## Purpose

Audit logs provide accountability for important system and clinical/financial operations.

## Events

At minimum:

- login
- logout
- failed login
- MFA change
- user creation
- role change
- permission change
- tenant approval
- patient create/update/archive
- clinical note create/sign/amend
- treatment plan create/accept
- imaging upload/access
- invoice create/adjust
- payment/refund
- claim submit/status
- API key create/revoke
- integration configuration
- data export
- sensitive record access where required

## Audit fields

```text
id
tenantId
actorUserId
action
resourceType
resourceId
occurredAt
requestId
correlationId
ipAddress
userAgent
result
metadata
```

Do not store full sensitive payloads by default.

## Audit access

Only privileged users should view audit logs.

Viewing audit logs can itself be audited.

## Clinical amendments

Clinical amendment records should preserve:

- original author
- original timestamp
- original content/version
- amendment author
- amendment time
- reason
- new content/version

## Retention

Retention periods must be configurable and validated against applicable legal/professional requirements.

Do not hard-code legal retention claims without professional review.




---

## security\authentication.md


# Authentication Architecture

## Requirements

Support:

- email/password
- email verification
- password reset
- MFA/2FA
- session management
- logout
- session revocation
- rate limiting
- suspicious login controls
- secure recovery

## Authentication vs authorization

Authentication answers:

> Who are you?

Authorization answers:

> What are you allowed to do?

Successful authentication must never automatically grant application access.

## Tenant approval

Initial organisation workflow:

```text
Registration
  â†“
Pending organisation
  â†“
Pending owner access
  â†“
Platform approval
  â†“
Organisation active
  â†“
Owner access
  â†“
Staff invitations
```

## Sessions

Use secure, short-lived access credentials and controlled refresh/session mechanisms.

Store refresh/session secrets safely.

Support revocation.

Track:

- session ID
- user
- tenant
- createdAt
- lastSeenAt
- expiry
- device metadata where appropriate

## MFA

Support TOTP initially.

Future options:

- WebAuthn/passkeys
- hardware security keys

MFA secrets must never be logged.

## Passwords

Use a modern password hashing algorithm such as Argon2id where supported.

Never store plaintext passwords.

## Rate limiting

Use Redis-backed rate limiting for:

- login
- password reset
- verification
- MFA
- public endpoints
- API keys

## Account states

Example:

- invited
- pending
- active
- suspended
- disabled
- locked

The backend must enforce state.

## API keys

API secrets are shown once and stored as hashes.

Support:

- scopes
- expiry
- revocation
- rotation
- last used
- tenant ownership




---

## security\authorization.md


# RBAC + RBA Authorization

## 1. Model

Use:

```text
User
  â†“
Role
  â†“
Permissions

plus

Policy
  â†“
Resource context
  â†“
Tenant / Practice / Location / Ownership
```

## 2. Permissions

Examples:

```text
patient:read
patient:create
patient:update
patient:archive

clinical:read
clinical:create
clinical:sign
clinical:amend

dental_chart:read
dental_chart:update

treatment_plan:read
treatment_plan:create
treatment_plan:approve

billing:read
billing:create
billing:adjust

payment:read
payment:create
payment:refund

claims:read
claims:submit
claims:cancel

imaging:read
imaging:upload
imaging:delete

reports:read
audit:read
users:manage
settings:manage
```

## 3. Roles

Initial roles:

- Platform Owner
- Platform Admin
- Organisation Owner
- Practice Manager
- Dentist
- Specialist
- Hygienist
- Dental Therapist
- Dental Assistant
- Receptionist
- Billing Officer
- Read Only

Roles are collections of permissions, not the final security decision.

## 4. Policy checks

Policy can consider:

- tenant
- practice
- location
- assigned practitioner
- patient relationship
- record type
- action
- record state

Example:

A receptionist can schedule an appointment for a patient in their location but cannot sign a clinical note.

## 5. Clinical record states

Permissions should differ between:

- draft
- signed
- amended
- archived

A signed clinical note should require a dedicated amendment permission.

## 6. Server enforcement

Every protected mutation must check authorization in the API.

Do not trust frontend route guards.

## 7. Deny by default

If no explicit permission/policy allows an operation, deny it.

## 8. Authorization testing

For each protected resource test:

- allowed role
- denied role
- wrong tenant
- wrong practice
- wrong location
- inactive user
- suspended user
- expired session




---

## security\security-model.md


# Security Model and Threats

## Threats

### Tenant escape

Risk:
A user accesses another tenant's patient/resource.

Controls:
- tenant context from server-side identity
- tenant-scoped repositories
- authorization policies
- integration tests

### IDOR/BOLA

Risk:
User changes a resource ID in the request.

Controls:
- resource-level authorization
- tenant scoping
- policy checks

### Privilege escalation

Risk:
User changes role/permission through API.

Controls:
- server-side role management
- protected permission endpoints
- audit logging
- no trust in client role

### Session theft

Controls:
- secure cookies/tokens
- rotation
- revocation
- HTTPS
- short expiry
- MFA

### File upload attacks

Controls:
- MIME/type validation
- extension validation
- size limits
- malware scanning readiness
- object storage isolation
- signed URLs
- no direct executable serving

### Payment duplication

Controls:
- idempotency
- external transaction IDs
- database uniqueness
- transaction boundaries

### Claim duplication

Same controls as payment.

### Audit tampering

Controls:
- append-oriented audit design
- restricted access
- audit the audit access
- database permissions
- immutable/retained storage strategy for higher assurance

### Sensitive data exposure

Controls:
- minimum necessary data
- response DTOs
- field-level restrictions
- access policies
- no sensitive logs
- encrypted transport/storage

## Security development requirements

Before merge:

- dependency scan
- secret scan
- lint
- typecheck
- tests
- authorization tests
- tenant isolation tests

## Secrets

Never commit:

- database passwords
- JWT secrets
- OAuth secrets
- HICAPS credentials
- Medicare credentials
- SMS provider secrets
- storage credentials

Use environment variables or a secret manager.




---

## testing\testing-strategy.md


# Testing Strategy

## Test pyramid

```text
           E2E
          /   \
     Integration
        /       \
       Unit / Component
```

## Unit tests

Test:

- domain rules
- policy decisions
- parsers
- calculations
- status transitions

## Integration tests

Test:

- Prisma
- PostgreSQL
- authentication
- authorization
- tenant isolation
- transactions

## API tests

Test:

- validation
- HTTP responses
- auth
- permissions
- pagination
- filtering
- errors

## Frontend tests

Test:

- forms
- validation
- components
- route behaviour
- query states
- permission-aware UI

## E2E critical journeys

### Onboarding

```text
Register
 â†“
Pending approval
 â†“
Platform approval
 â†“
Owner login
 â†“
Invite staff
```

### Patient

```text
Create patient
 â†“
Search patient
 â†“
Open workspace
 â†“
Edit demographic data
```

### Appointment

```text
Create
 â†“
Confirm
 â†“
Check-in
 â†“
Complete
```

### Clinical

```text
Open patient
 â†“
Dental chart
 â†“
Clinical note
 â†“
Sign
 â†“
Attempt amendment
```

### Treatment

```text
Create plan
 â†“
Present
 â†“
Accept
 â†“
Complete treatment
```

### Billing

```text
Create invoice
 â†“
Payment
 â†“
Allocation
 â†“
Receipt
```

### Claim

```text
Create claim
 â†“
Submit
 â†“
Provider result
 â†“
Reconcile
```

## Mandatory security tests

Cross-tenant:

- read
- update
- delete
- export

Privilege escalation:

- change role
- access restricted clinical note
- sign note
- refund payment
- submit claim

## Regression

Every production bug should result in a regression test where practical.




---

## ui-ux\design-system.md


# Danta UI/UX Design System

## References

Primary visual inspiration:

- DashboardPack/TailPanel reference supplied for Danta
- shadcn/ui component philosophy

Functional references:

- Dentally
- Dental4Windows
- Zavy360
- supplied Apex Dental reference

Do not copy proprietary interfaces.

## Product personality

Danta should feel:

- clinical
- calm
- trustworthy
- modern
- premium
- efficient

Avoid making it look like a generic admin template.

## Typography

Preferred primary font:

Inter

Alternative:

Plus Jakarta Sans

Use one primary typeface consistently.

## Layout

Desktop-first because dental practices commonly use large clinical monitors.

Recommended:

- collapsible sidebar
- compact top navigation
- content max-width where appropriate
- dense but breathable tables
- sticky patient header where useful

## Colour

Use a neutral shadcn-style foundation with a restrained clinical accent.

Define semantic tokens:

```text
background
foreground
card
muted
muted-foreground
border
primary
primary-foreground
success
warning
destructive
info
```

Never encode semantic meaning only through colour.

## Radius

Use moderate radius.

Avoid overly rounded "consumer app" styling.

## Components

Base on shadcn/ui:

- Button
- Input
- Select
- Combobox
- Dialog
- Sheet
- Drawer
- Dropdown
- Tabs
- Table
- Calendar
- Badge
- Tooltip
- Alert
- Form
- Command
- Toast

Danta domain components:

- PatientSearch
- PatientHeader
- PatientAlert
- AppointmentCard
- CalendarAppointment
- Tooth
- DentalChart
- TreatmentPlan
- ClinicalNoteEditor
- InvoiceSummary
- PaymentStatus
- ClaimStatus
- RecallStatus
- ImagingViewer
- AuditTimeline

## Dashboard

Suggested layout:

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Search       Quick Add     Notifications User â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚          â”‚ KPI cards                          â”‚
â”‚ Sidebar  â”‚                                    â”‚
â”‚          â”‚ Today's schedule / actions         â”‚
â”‚          â”‚                                    â”‚
â”‚          â”‚ Recent patients / outstanding      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

## Clinical UX

Clinical actions should be reachable with minimal clicks.

Avoid modal overload.

Prefer contextual side panels/drawers where the clinician needs to preserve context.

## Calendar UX

Prioritize:

- clear provider columns
- chair/resource visibility
- drag/drop with confirmation rules
- appointment status
- patient identity
- treatment context
- quick actions

## Accessibility

Target WCAG 2.2 AA where practical.

Keyboard navigation is particularly important for reception and clinical workflows.

## Responsive

Desktop:
full application

Tablet:
optimized clinical/reception workflows

Mobile:
prioritize patient portal and limited staff workflows rather than attempting to compress every desktop screen.




