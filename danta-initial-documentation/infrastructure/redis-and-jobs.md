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
 ↓
Reminder schedule created
 ↓
Worker job
 ↓
check appointment state
 ↓
check communication preference
 ↓
send message
 ↓
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
