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
