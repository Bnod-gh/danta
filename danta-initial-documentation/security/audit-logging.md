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
