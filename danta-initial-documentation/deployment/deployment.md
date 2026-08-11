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
