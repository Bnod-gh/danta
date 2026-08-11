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
  ↓
Tenancy
  ↓
Identity / Authorization
  ↓
Patient
  ├── Scheduling
  ├── Clinical
  ├── Dental Chart
  ├── Treatment Planning
  ├── Imaging
  ├── Documents
  ├── Billing
  ├── Claims
  └── Recall

Billing
  ├── Payments
  └── Claims

Communication
  └── Recall/Scheduling

Integrations
  └── Billing/Claims/Imaging/Communication

Reporting
  └── read-oriented projections/queries
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
  ↓
DTO
  ↓
authorization
  ↓
controller
  ↓
application service
  ↓
repository
  ↓
database
  ↓
tests
  ↓
audit
```

Do not build the entire database first and postpone business logic.
