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
                    ┌─────────────────────┐
                    │      Browser        │
                    │ React + TanStack    │
                    └──────────┬──────────┘
                               │ HTTPS
                               ▼
                    ┌─────────────────────┐
                    │      NestJS API     │
                    │ Auth / API / Domain │
                    └───────┬─────┬───────┘
                            │     │
               ┌────────────┘     └──────────────┐
               ▼                                  ▼
        ┌───────────────┐                 ┌──────────────┐
        │  PostgreSQL   │                 │    Redis     │
        │ Source of     │                 │ Cache/Queue/ │
        │ truth         │                 │ Locks/Rate   │
        └───────────────┘                 └──────┬───────┘
                                                 │
                                                 ▼
                                         ┌───────────────┐
                                         │ Worker        │
                                         │ BullMQ/jobs   │
                                         └──────┬────────┘
                                                │
                         ┌──────────────────────┼────────────────────┐
                         ▼                      ▼                    ▼
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
  ↓
Authentication
  ↓
Tenant context
  ↓
Input validation
  ↓
Authorization policy
  ↓
Controller
  ↓
Application service
  ↓
Domain/business rules
  ↓
Repository/data access
  ↓
Prisma/PostgreSQL
  ↓
Audit/event where required
  ↓
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
    ↓
Internal provider interface
    ↓
Adapter
    ↓
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
