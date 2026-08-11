# Danta Implementation Roadmap

## Phase 0 — Foundation

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

## Phase 1 — Identity and SaaS

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

## Phase 2 — Patient

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

## Phase 3 — Calendar

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

## Phase 4 — Clinical

Build:

- clinical notes
- templates
- signed/versioned notes
- dental chart
- tooth findings
- treatment history
- periodontal foundation

## Phase 5 — Treatment

Build:

- treatment plans
- treatment items
- acceptance
- estimates
- clinical-to-billing handoff

## Phase 6 — Imaging

Build:

- imaging studies
- object storage
- upload
- viewer
- metadata
- tooth association
- local connector abstraction

## Phase 7 — Billing

Build:

- fee schedules
- invoices
- payments
- allocations
- refunds
- credit notes
- receipts
- statements

## Phase 8 — Australian integrations

Build adapters and official integrations only when provider access/documentation is available:

- HICAPS
- Medicare
- DVA
- Tyro

## Phase 9 — Recall and communication

Build:

- recall rules
- recall queue
- SMS
- email
- templates
- reminders
- communication preferences

## Phase 10 — Reporting

Build:

- dashboard
- practice KPIs
- revenue
- production
- collections
- claims
- recall
- practitioner metrics

## Phase 11 — Patient portal

Build:

- patient authentication
- appointments
- forms
- treatment plans
- documents
- invoices
- payments
- communication

## Phase 12 — Advanced platform

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
