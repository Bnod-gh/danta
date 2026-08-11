# Danta Documentation

Danta is an Australian-first, multi-tenant Dental Practice Management SaaS (PMS).

## Technology direction

- Turborepo monorepo
- pnpm workspaces
- NestJS + TypeScript
- PostgreSQL + Prisma
- Redis
- React + Vite
- TanStack Router
- TanStack Query
- TanStack Form
- TanStack Table
- Zod as the contract/validation source of truth
- nestjs-zod
- shadcn/ui + Tailwind CSS
- Swagger/OpenAPI

## Documentation map

- `architecture/system-architecture.md` — overall system
- `architecture/domain-architecture.md` — bounded domains and dependencies
- `architecture/multi-tenancy.md` — tenant isolation
- `architecture/decisions.md` — architecture decisions
- `database/database-design.md` — data model direction
- `security/authentication.md` — authentication
- `security/authorization.md` — RBAC/RBA
- `security/security-model.md` — threat model and controls
- `api/api-standards.md` — REST/API conventions
- `frontend/frontend-architecture.md` — TanStack frontend architecture
- `ui-ux/design-system.md` — Danta UI system
- `clinical/clinical-architecture.md` — dental/clinical model
- `calendar/calendar-architecture.md` — scheduling
- `billing/billing-architecture.md` — billing and payments
- `integrations/australian-integrations.md` — HICAPS/Medicare/DVA/Tyro boundaries
- `imaging/imaging-architecture.md` — X-ray/imaging
- `infrastructure/redis-and-jobs.md` — Redis and workers
- `security/audit-logging.md` — audit design
- `testing/testing-strategy.md` — test strategy
- `deployment/deployment.md` — deployment
- `roadmap/implementation-roadmap.md` — phased delivery

## Rule

Architecture documentation is part of the product. When implementation changes an architectural decision, update the relevant document in the same change.
