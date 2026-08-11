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
