# Multi-Tenancy Strategy

## 1. Tenant hierarchy

```text
Platform
  └── Organisation
       └── Practice
            └── Location
                 └── Users / Patients / Clinical data
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
