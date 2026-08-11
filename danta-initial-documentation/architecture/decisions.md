# Architecture Decision Records

## ADR-001 — Turborepo monorepo

Decision:
Use Turborepo with pnpm workspaces.

Reason:
- Shared schemas
- Shared UI
- Shared auth/permission types
- Independent app builds
- Incremental task caching
- Clear application/package boundaries

## ADR-002 — PostgreSQL is authoritative

Decision:
PostgreSQL is the source of truth for business data.

Redis is not authoritative.

## ADR-003 — Zod is contract source

Decision:
Use Zod as the primary validation/schema source shared between frontend and backend.

Use nestjs-zod for NestJS integration.

Avoid manually duplicated validation DTO definitions.

## ADR-004 — Prisma

Decision:
Use Prisma for persistence.

Business logic must not depend directly on Prisma models outside data-access boundaries.

## ADR-005 — TanStack

Decision:
- TanStack Router for routing
- TanStack Query for server state
- TanStack Form for forms
- TanStack Table for data tables

Avoid unnecessary `useEffect` for server state.

## ADR-006 — shadcn/ui

Decision:
Use shadcn/ui primitives and build Danta domain components on top.

Do not tightly fork primitives unless required.

## ADR-007 — Integration adapters

Decision:
HICAPS, Medicare, Tyro, SMS, email and imaging integrations use provider interfaces/adapters.

## ADR-008 — Object storage

Decision:
Large files such as X-rays and documents belong in object storage. PostgreSQL stores metadata.

## ADR-009 — Async processing

Decision:
Redis-backed queues are used for work that does not need to complete inside the request transaction.

## ADR-010 — Clinical record immutability

Decision:
Signed clinical records are not silently overwritten. Amendments preserve history.

## ADR-011 — Money

Decision:
Use PostgreSQL numeric/decimal for monetary values. Never use floating-point arithmetic for financial amounts.

## ADR-012 — Authorization

Decision:
Use RBAC plus resource/policy authorization (RBA-style policy checks). Roles alone are insufficient.
