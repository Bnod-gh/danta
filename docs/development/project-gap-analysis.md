# Danta — Project Gap Analysis

**Date:** 2026-08-12  
**Scope:** Full monorepo audit against `project.md` requirements  
**Status:** Production readiness is LOW — significant security, architecture, and completeness gaps remain.

---

## 1. Completed Correctly

| Feature | Evidence | Production Ready? |
|---------|----------|-------------------|
| Turborepo + pnpm monorepo | `pnpm-workspace.yaml`, `turbo.json`, apps/ and packages/ structure | ✅ Yes |
| NestJS API bootstrap | `apps/api/src/main.ts`, 49 modules, `/api/v1` prefix | ✅ Yes |
| React/Vite frontend | `apps/web/src/main.tsx`, Vite 6, React 19 | ✅ Yes |
| TanStack Router | 85+ route files, file-based routing | ✅ Yes |
| TanStack Query | `apps/web/src/lib/query-client.ts` | ✅ Yes |
| TanStack Form | Used on login/register pages | ⚠️ Partial (limited adoption) |
| TanStack Table | Dependency present, limited usage | ⚠️ Partial |
| shadcn/ui | `@danta/ui` package exists, only `cn` utility exported | ❌ No components shared |
| Tailwind CSS | v4 configured with `@tailwindcss/vite` | ✅ Yes |
| Prisma + PostgreSQL | 37 models, 15 migrations, Decimal types for most financial fields | ⚠️ Partial (see §7) |
| Zod validation | 50+ schemas in `packages/schemas` | ✅ Yes |
| nestjs-zod DTOs | `ZodValidationPipe` global | ✅ Yes |
| Swagger/OpenAPI | Configured at `/api/docs` | ⚠️ Partial (not gated by env) |
| Multi-tenancy model | Organisation → Practice → Location → User | ✅ Yes |
| JWT authentication | Access + refresh tokens, session persistence | ⚠️ Partial (fallback secrets) |
| MFA (TOTP) | `MfaService` with real TOTP validation | ✅ Yes (after remediation) |
| RBAC | `PermissionsGuard`, `RequirePermissions` decorator | ⚠️ Partial (was static, now queries DB) |
| Patient CRUD | Full CRUD + search + profile | ✅ Yes |
| Calendar/Appointments | Booking, rescheduling, cancellation, status | ⚠️ Partial (no drag/drop, waitlist, recurring) |
| Clinical notes | CRUD + templates | ⚠️ Partial (no draft/sign/amend workflow) |
| Dental chart | Tooth conditions, treatment history | ⚠️ Partial (no FDI validation, surfaces) |
| Periodontal records | CRUD | ⚠️ Partial (no chart visualization) |
| Treatment plans | CRUD | ⚠️ Partial (no versioning, states) |
| Imaging | Studies, images, metadata, storage abstraction | ⚠️ Partial (no multipart upload, signed URLs, DICOM) |
| Billing | Services, fees, invoices, payments, refunds | ⚠️ Partial (no void workflow, reconciliation) |
| Communication | Templates, reminders, recalls, notifications | ⚠️ Partial (no actual delivery mechanism) |
| Reporting | 8 endpoints (dashboard, revenue, production, etc.) | ⚠️ Partial (unbounded queries, no export) |
| Patient portal | Separate JWT strategy, 9 endpoints, frontend routes | ⚠️ Partial (tenant isolation fixed, refresh secret fixed) |
| BullMQ worker | `apps/worker` with queue infrastructure | ⚠️ Partial (no job types defined) |
| Docker Compose | PostgreSQL + Redis with healthchecks | ✅ Yes (no app containers) |
| CI pipeline | `.github/workflows/ci.yml` — install, lint, typecheck, test | ⚠️ Partial (no build, no security scanning) |

---

## 2. Partially Implemented

### Authentication
- **Current:** JWT with access/refresh tokens, MFA TOTP, password reset, email verification, invitations, API keys.
- **Missing/Incomplete:**
  - Token refresh in frontend (no interceptor, no proactive refresh)
  - Session listing/management for users
  - Account lockout/login attempt protection
  - Device fingerprinting
  - API key authentication strategy (API keys are JWTs, not opaque tokens validated via `validateKey()`)

### Authorization
- **Current:** RBAC with `RequirePermissions` + `PermissionsGuard`.
- **Missing/Incomplete:**
  - Resource-level authorization (ownership/relationship policies)
  - Tenant/practice/location-level authorization beyond `tenantId`
  - Clinical authorization policies (sign/amend)
  - Financial authorization policies
  - Deny-by-default enforcement
  - Authorization integration tests

### Calendar
- **Current:** Appointment types, providers, chairs, availability, booking, rescheduling, cancellation, check-in, status enum.
- **Missing:** Day/week/month views, multi-provider view, resource/chair view, drag/drop, conflict detection, double-booking rules, waitlist, recurring appointments, reminder dispatch.

### Clinical
- **Current:** Clinical notes, templates, dental chart, tooth conditions, treatment history, treatment plans, periodontal records.
- **Missing:** Draft/sign/amend workflow, version history, amendment reason/audit, FDI numbering validation, tooth surfaces enum, periodontal chart visualization, treatment plan states/versions.

### Imaging
- **Current:** Studies, images, metadata, patient/tooth association, storage abstraction.
- **Missing:** Multipart upload, object storage adapter (S3/GCS/Azure), signed URLs, file validation, DICOM viewer, metadata parsing, storage cleanup, access authorization, audit logging.

### Billing
- **Current:** Services, fees, invoices, payments, refunds, statements (runtime-only), receipts (no persistence).
- **Missing:** `Statement`/`Receipt` DB models, void workflow, credit notes CRUD, adjustments, write-offs, payment allocation, partial payment tracking, reconciliation, `TreatmentHistory.cost` is `Float` not `Decimal`.

### Communication
- **Current:** SMS/email templates, appointment reminders, recalls, notifications, patient preferences — all CRUD endpoints.
- **Missing:** Actual delivery mechanism (Twilio/SendGrid), retry handling, bounce handling, failed delivery recovery, opt-out handling, communication history/audit, zero built-in templates.

### Reporting
- **Current:** 8 endpoints with basic aggregation.
- **Missing:** Read-optimized queries, reporting indexes, background generation, claim/payment/treatment analytics, custom date ranges, CSV/PDF export, permission-aware reports.

### Patient Portal
- **Current:** Separate JWT, 9 endpoints, frontend routes for login, dashboard, appointments, treatment plans, documents, forms, billing, payments, messages, notifications.
- **Missing:** Medical history, consent, imaging access, privacy controls, profile update, appointment actions, form submission, message send, notification mark-as-read, frontend token refresh.

### Mobile
- **Current:** Expo app scaffold with login, dashboard, appointments, forms screens.
- **Missing:** Not in workspace, hardcoded localhost, no secure storage, only 4 of ~12 screens, no protected routes.

### Frontend
- **Current:** 55 routes, TanStack Query, TanStack Form, Tailwind v4.
- **Missing:** Auth state management (no Context/Zustand), token refresh interceptor, loading/empty/error states, error boundaries, accessibility baseline, Danta design tokens, shared shadcn/ui components (only `cn` exported).

### Infrastructure
- **Current:** Docker Compose (PostgreSQL + Redis), CI pipeline.
- **Missing:** Application Dockerfiles, multi-stage builds, non-root containers, object storage, local email/SMS services, worker queue definitions, health/readiness endpoints, dependency/secret scanning, migration CI validation.

---

## 3. Incorrect Implementation

### Security
1. **Hardcoded JWT fallback secrets** — 3 strategy files + `auth.service.ts` + `patient-portal.service.ts` use `|| 'default-secret'` / `|| 'default-refresh-secret'`. If env vars are missing, tokens are signed with known secrets.
2. **API key strategy uses JWT validation** — `ApiKeyStrategy` extends `PassportStrategy(Strategy, 'api-key')` but validates via JWT. Any JWT signed with the same secret matches. `ApiKeysService.validateKey()` (bcrypt comparison) is never called.
3. **MFA timing side-channel** — `validateUser` returns null for wrong email (no DB hit timing) vs wrong password (bcrypt timing). Should use constant-time comparison or rate limiting.

### Data Integrity
4. **`TreatmentHistory.cost` is `Float`** — should be `Decimal(10,2)` for financial precision.
5. **Missing `tenantId` in Prisma queries** — `invoices.service.ts:48` and `refunds.service.ts:117` have `findFirst` without tenant filter — IDOR risk.
6. **No DB-level FK for `tenantId`** — tenant isolation is application-level only. No FK from `tenantId` → `Organisation.id`.
7. **No `Statement` or `Receipt` DB models** — billing completeness claims are misleading.

### Architecture
8. **`apps/mobile` is not in `pnpm-workspace.yaml`** — cannot share workspace packages, dependency drift.
9. **Prisma queries in controllers** — some controllers call `this.prisma.model` directly instead of going through a service layer.
10. **`req.user as any` everywhere** — 50+ controllers cast `req.user` to `any`, bypassing TypeScript safety.
11. **No Redis caching in API** — Redis exists but API doesn't use it for permissions, tenant settings, or rate limiting.
12. **`routeTree.gen.ts` is manually maintained** — stale, incomplete, with `as any` casts. Should be auto-generated or use TanStack Router v1 file-based route tree properly.

### Frontend
13. **No auth state management** — `localStorage` checks in `__root.tsx`, no React Context, no token refresh.
14. **No Authorization headers on fetch** — API calls rely on browser defaults; no interceptor attaches Bearer tokens.
15. **`__root.tsx` auth check is naive** — checks `localStorage` without expiry validation or React Query integration.

---

## 4. Missing

### Phase 0 — Foundation
- Strict package dependency boundaries enforcement
- Circular dependency detection in CI
- Dependency vulnerability scanning (e.g., `pnpm audit`, Snyk)
- Secret scanning (e.g., gitleaks, truffleHog)
- Automated migration validation in CI
- Request/correlation ID middleware
- Structured logging (pino in API)
- API versioning strategy beyond `/api/v1` prefix
- Rate limiting per-endpoint/per-user (not just global)
- Security headers (Helmet, CSP, HSTS)
- CORS policy strictness
- Request size limits
- File upload limits
- Object storage adapter
- Local email/SMS development services
- Worker queue definitions (email, SMS, reminders, etc.)
- Health/readiness endpoints
- Database seed strategy
- Test database strategy

### Phase 1 — SaaS Foundation
- Tenant-aware repository patterns
- Tenant isolation integration tests
- Cross-tenant access tests
- Tenant lifecycle states (suspension, deactivation, export, deletion)
- Pending tenant access restrictions
- Super admin approval workflow
- Session revocation/listing endpoints
- Device/session management
- Account lock/suspension
- Login attempt protection
- Resource-level authorization
- Practice/location-level authorization
- Ownership/relationship policies
- Clinical/financial authorization policies
- Deny-by-default policy
- Authorization integration test suite
- API key scopes (defined in schema but not enforced)
- API key rotation
- API key rate limiting
- Organisation/practice/location settings (timezone, currency, tax, branding, etc.)

### Phase 2 — Patient Management
- Duplicate patient detection/merge workflow
- Patient workspace tabs (overview, clinical, chart, treatment, imaging, billing, claims, communication, recalls, audit)
- Sensitive-field access rules
- Patient data export
- Patient record access auditing
- Document access auditing
- Consent history
- Communication consent
- Patient archive/restore
- DOB validation, phone/email normalization

### Phase 3 — Calendar
- Day/week/month/multi-provider/resource views
- Drag/drop rescheduling
- Conflict detection/double-booking rules
- Waitlist
- Recurring appointments
- Reminder scheduling + dispatch (worker jobs)
- Reminder retry/delivery tracking/idempotency

### Phase 4 — Clinical & Dental
- Clinical note states: Draft → Signed → Amended with version history
- Amendment workflow with reason + audit
- FDI numbering validation, primary/adult dentition
- Tooth surfaces enum (M/D/B/L/I/O/V)
- Missing teeth, restorations, crowns, bridges, implants, root canal, extraction, dentures
- Periodontal chart visualization (pocket depth, bleeding, recession, mobility, furcation)
- Treatment plan states: Draft, Presented, Accepted, Partially accepted, Rejected, Expired, Cancelled, Completed
- Treatment plan versioning
- Patient estimate, health fund estimate, gap calculation
- Treatment acceptance audit

### Phase 5 — Imaging
- Multipart file upload with progress
- Object storage adapter (S3/GCS/Azure)
- Signed URLs with expiry
- File type/size validation
- File checksum/hash
- DICOM viewer (zoom, pan, rotate, brightness/contrast, metadata panel)
- Image access authorization
- Original file protection
- Upload progress + failed upload recovery
- Image audit logging

### Phase 6 — Billing
- `Statement` and `Receipt` database models
- Void workflow (status + audit, not hard-delete)
- Credit notes (DELETE/UPDATE endpoints missing)
- Adjustments, write-offs
- Payment allocation, partial payment
- Outstanding balance calculation
- Reconciliation module
- Decimal type for `TreatmentHistory.cost`
- Idempotency keys for payments/refunds
- External transaction IDs
- Payment/refund audit trails
- Duplicate payment protection
- Practice/location/provider fee schedules with effective dates

### Phase 7 — Australian Claims
- Provider adapters for HICAPS, Medicare, DVA
- Claim submission, response, status tracking
- Eligibility workflows
- Error handling + retry
- Reconciliation
- Sandbox testing
- Production onboarding
- Credential encryption

### Phase 8 — Communication
- Actual delivery (Twilio, SendGrid, etc.)
- Retry, bounce, failed delivery handling
- Opt-out handling
- Communication history/audit
- Built-in templates (confirmation, reminder, cancellation, recall, receipt, statement, treatment plan)
- Recall rules, schedules, queue, attempts, outcomes, analytics
- Automated recall campaigns
- Reminder scheduling + dispatch via worker

### Phase 9 — Reporting
- Claim analytics, payment analytics, treatment acceptance
- Chair utilization, no-show analysis
- Custom date ranges
- CSV/PDF export
- Read-optimized queries + reporting indexes
- Background report generation for large datasets
- Permission-aware reports

### Phase 10 — Audit, Security & Compliance
- Complete audit log coverage (auth, authz, patient access, clinical, imaging, billing, payment, claim, user/role, settings, data exports)
- Tenant isolation tests
- IDOR/BOLA testing
- Privilege escalation testing
- API authentication testing
- API key security testing
- Brute-force protection
- Session security testing
- MFA security testing
- File upload security testing
- Input validation testing
- SQL injection testing
- XSS/CSRF testing
- CORS configuration review
- Security headers
- Secret/dependency/container scanning
- Penetration testing
- Encryption in transit/at rest
- Sensitive logging review
- Data retention/deletion workflow
- Backup/recovery testing
- Australian privacy/compliance assessment

### Phase 11 — Observability & Reliability
- Structured logging with request/correlation/tenant IDs
- API latency/error rate monitoring
- PostgreSQL/Redis health monitoring
- Queue depth, worker failure, storage failure monitoring
- Alerting (API outage, DB failure, worker backlog, payment/claim failure spikes)
- Retry strategy, dead-letter queue
- Idempotent jobs
- Graceful shutdown
- Health/readiness endpoints
- Database backup + restore testing
- Disaster recovery plan

### Phase 12 — Background Jobs & Redis
- BullMQ job type definitions (email, SMS, reminders, recalls, reports, webhooks, imaging, exports, notifications)
- Retry policies, backoff, timeout
- Failure tracking + correlation IDs
- Tenant context in jobs
- Idempotency guarantees

### Phase 13 — SaaS Subscription & Platform Billing
- SaaS plans, trial, subscription, status, plan limits, feature entitlements
- Usage tracking, upgrade/downgrade, cancellation, grace period
- Platform billing (invoices, payments, provider, failed payment handling, reconciliation)

### Phase 14 — Patient Portal
- Medical history, consent, imaging access, privacy controls
- Profile update, appointment actions (cancel/reschedule), form submission
- Message send, notification mark-as-read
- Frontend token refresh, 401 handling
- MFA/passkey consideration

### Phase 15 — Mobile
- Bring `apps/mobile` into workspace
- Secure storage (expo-secure-store)
- All screens (treatment plans, documents, billing, payments, messages, notifications, profile)
- Protected route guards
- Reuse existing API/Zod/auth

### Phase 16 — Performance
- Query profiling, N+1 detection
- Database indexes review
- Cursor pagination where required
- Redis caching for permissions/tenant settings
- Route-level code splitting
- Virtualized large tables
- Calendar/patient search performance
- Measurable latency targets

### Phase 17 — Deployment & Production
- Multi-stage Dockerfiles for API, web, worker
- Non-root containers
- Multi-environment config (dev/staging/prod)
- Secret management (vault, env injection)
- Production PostgreSQL with automated backups + PITR
- CI/CD with build, test, security scan, deploy
- Domain, TLS, reverse proxy, CDN
- Monitoring, logging, alerting

### Phase 18 — Quality Gates
- Unit tests (services, guards, utilities)
- Integration tests (API, tenant isolation, authorization)
- Frontend component tests
- Authorization test suite
- Tenant isolation test suite
- Security review
- Performance review

### Phase 19 — Definition of Done
- All features must pass through: Requirements → Domain → Zod → Prisma → API → Auth → AuthZ → Audit → Frontend → States → Tests → Swagger → Observability → Docs

---

## 5. Technical Debt

### Duplicated Schemas/Validation
- Pagination: `PaginationSchema` exists but services inconsistently use `skip`/`take` vs `page`/`pageSize`.
- Some DTOs are manually typed in controllers instead of using Zod-inferred types.

### Incorrect Package Boundaries
- `apps/mobile` outside workspace — cannot consume `@danta/schemas`, `@danta/auth`, etc.
- `@danta/ui` only exports `cn` — no shared components despite shadcn/ui being "installed".
- `packages/auth` depends on `@danta/schemas` but also imports Prisma directly — should depend on `@danta/database`.

### Prisma Access from Controllers
- Some controllers call `this.prisma.model` directly instead of delegating to a service.

### Missing Authorization
- `invoices.service.ts:48` — `findFirst` without `tenantId`
- `refunds.service.ts:117` — `findFirst` without `tenantId`
- 50+ controllers use `req.user as any` — type safety bypass

### Missing Tenant Filtering
- No DB-level FK for `tenantId` → `Organisation.id`
- No automated enforcement that every query includes tenant scope

### Unsafe Redis Usage
- No Redis usage in API (no caching, rate limiting, session store)
- Worker has generic queue with no job types

### Unnecessary Global State
- Frontend: no auth context, `localStorage` scattered across components

### Incorrect TanStack Usage
- `routeTree.gen.ts` manually maintained with `as any` casts
- No route-level code splitting
- No error boundaries

### Missing Tests
- Only 1 spec file exists (`auth.controller.spec.ts`)
- No unit, integration, or authorization tests
- No test database strategy

### Missing Audit Events
- `AuditLog` model exists but `correlationId` is never populated (no middleware)
- Many operations skip audit logging
- No structured logging in API

---

## 6. Security Risks

### Critical
| Risk | Location | Impact |
|------|----------|--------|
| Hardcoded JWT fallback secrets | 3 strategy files + auth.service.ts + patient-portal.service.ts | Token forgery if env vars missing |
| API key strategy uses JWT validation | `api-keys/strategies/api-key.strategy.ts` | Any JWT with matching secret is valid API key |
| Missing tenantId in Prisma queries | `invoices.service.ts:48`, `refunds.service.ts:117` | IDOR — cross-tenant data access |
| `TreatmentHistory.cost` is Float | `schema.prisma` | Financial precision loss |
| No API key authentication strategy | `api-keys.service.ts` — `validateKey()` never called | API keys cannot authenticate requests |
| MFA timing side-channel | `auth.service.ts` `validateUser` | Username enumeration |
| `.env` file in repo | Root `.env` (exists, may be tracked) | Potential secret leak |

### High
| Risk | Location | Impact |
|------|----------|--------|
| No request/correlation ID | Global middleware missing | No request tracing |
| No structured logging | API (pino only in worker) | Poor observability |
| Swagger exposed without env gate | `main.ts` | Information disclosure in prod |
| No security headers | Missing globally | XSS, clickjacking, MIME sniffing |
| Global throttler too permissive | 100 req/60s | Brute-force vulnerability |
| No login attempt protection | Auth module | Account enumeration, brute-force |
| Frontend tokens in localStorage | Web app | XSS risk, no httpOnly cookies |
| No file upload validation | Imaging/patient documents | Malicious file upload |

### Medium
| Risk | Location | Impact |
|------|----------|--------|
| No CORS strictness | `main.ts` | Origin confusion attacks |
| No rate limiting per-user/per-tenant | Global throttler only | DoS risk |
| No session listing/management | Auth module | Session hijacking undetected |
| No account lockout | Auth module | Brute-force |
| No Redis caching in API | API modules | Performance + no session store |
| No error boundaries | React app | Poor UX, potential info leak |

---

## 7. Database Risks

### Tenant Isolation
- **No DB-level FK** for `tenantId` → `Organisation.id` on most models
- Application-level isolation only — prone to human error
- No automated tenant-isolation tests

### Foreign Keys
- Missing FK: `Provider.userId` → `User.id`
- Missing FK: `Chair.locationId` → `Location.id`
- Missing FK: Communication models (`Message`, `Recall`, etc.) have no explicit relations
- Cascade rules inconsistent (some `Cascade`, some `SetNull`)

### Indexes
- Most `tenantId` columns have `@@index`
- Missing composite indexes for common query patterns (e.g., `tenantId + status + createdAt` for appointments)
- No reporting-specific indexes

### Unique Constraints
- ✅ `tenantId + patientNumber` unique
- ✅ `tenantId + invoiceNumber` unique
- ❌ Missing: `tenantId + email` on `Patient` (if patients have accounts)
- ❌ Missing: `tenantId + name` on some config models

### Nullable Fields
- `Patient.dateOfBirth` is `DateTime?` — should be non-nullable for data quality
- `Patient.email`/`phone` nullable — acceptable but affects patient portal login

### Cascade Behaviour
- `Organisation → Practice` uses `Cascade` — deleting an org deletes all practices
- `User → Session` uses `Cascade` — good
- Some `onDelete: SetNull` without business rule documentation

### Financial Precision
- ✅ Most financial fields use `Decimal`
- ❌ `TreatmentHistory.cost` is `Float`
- ❌ No `Decimal` in frontend types (all `number`)

### Migration Quality
- 15 migrations exist, all named descriptively
- No rollback scripts
- No migration validation in CI

---

## 8. Architecture Risks

### Circular Dependencies
- ✅ None detected currently
- Risk: `apps/mobile` outside workspace may introduce ad-hoc imports

### Package Responsibilities
- `packages/auth` imports Prisma directly — should depend on `@danta/database`
- `@danta/ui` is a "shell" — no actual UI components
- `packages/config` reads env directly — acceptable for config package

### Domain Coupling
- Clinical, billing, imaging, communication modules are independent — good
- `Patient` model is central — high coupling expected
- No domain events or pub/sub for cross-module communication

### Duplicated Business Logic
- Tenant filtering logic repeated in every service `findAll`
- Audit logging scattered (some services log, some don't)
- Pagination logic inconsistent (skip/take vs page/pageSize)

### Integration Coupling
- No external integration abstractions beyond imaging
- HICAPS/Medicare/DVA have no adapters — only config CRUD

### Inappropriate Redis Usage
- Redis exists but API doesn't use it
- Worker has generic queue — no typed jobs

### Frontend State Management
- No auth context, no global state management
- `localStorage` for tokens — no refresh, no expiry handling
- No request interceptor for auth headers

---

## 9. Recommended Implementation Order

### P0 — Critical (Security, Data Integrity, Tenant Isolation)
1. **Fix hardcoded JWT secrets** — enforce env vars, remove fallbacks
2. **Fix IDOR vulnerabilities** — add missing `tenantId` to `invoices.service.ts` and `refunds.service.ts`
3. **Fix `TreatmentHistory.cost`** — change `Float` to `Decimal(10,2)` + migration
4. **Fix API key strategy** — implement proper opaque token validation or remove broken strategy
5. **Add request/correlation ID** middleware
6. **Add structured logging** (pino) to API
7. **Add security headers** (Helmet or custom middleware)
8. **Gate Swagger** by environment
9. **Add per-endpoint rate limiting** for auth endpoints
10. **Add login attempt protection** (account lockout, exponential backoff)

### P1 — Architecture (Package Boundaries, Schemas, Prisma, NestJS, Frontend)
11. **Bring `apps/mobile` into workspace** — add to `pnpm-workspace.yaml`
12. **Fix `@danta/ui`** — export shared shadcn components
13. **Standardize pagination** — use `skip`/`take` consistently or adopt cursor pagination
14. **Add DB-level FK constraints** for tenant isolation
15. **Fix `req.user as any`** — proper TypeScript typing for user in controllers
16. **Add frontend auth context** + token refresh interceptor
17. **Add error boundaries** + loading/empty/error state components
18. **Regenerate `routeTree.gen.ts`** properly with TanStack Router generator
19. **Add missing Prisma relations** (Provider→User, Chair→Location, Communication models)
20. **Add reporting indexes** + query optimization

### P2 — Functional (Missing Product Features)
21. **Clinical workflow** — draft/sign/amend, version history, FDI validation
22. **Treatment plan states** + versioning
23. **Imaging upload** — multipart, signed URLs, file validation
24. **Billing completeness** — Statement/Receipt models, void workflow, reconciliation
25. **Communication delivery** — Twilio/SendGrid integration, retry, bounce handling
26. **Recall automation** — rules, schedules, worker jobs
27. **Reporting exports** — CSV/PDF, background generation
28. **Patient portal completion** — medical history, consent, imaging, privacy controls
29. **Mobile app** — all screens, secure storage, protected routes

### P3 — Quality (Tests, Observability, Performance, Documentation, Deployment)
30. **Write tests** — unit, integration, authorization, tenant isolation
31. **Add test database strategy** + CI integration
32. **Add application Dockerfiles** + multi-stage builds
33. **Add monitoring/alerting** (API latency, DB health, queue depth)
34. **Add health/readiness endpoints**
35. **Add worker job types** (email, SMS, reminders, recalls, reports)
36. **Performance optimization** — query profiling, N+1 detection, caching
37. **Add CI build + security scanning**
38. **Add deployment pipeline** (staging + production)
39. **Australian compliance** — privacy assessment, data retention, incident response

---

## 10. Database Migration Required

The following Prisma schema changes require migrations:

```prisma
// TreatmentHistory.cost
model TreatmentHistory {
  cost Decimal? @db.Decimal(10, 2)  // was Float
}

// New models needed
model Statement {
  id            String    @id @default(uuid()) @db.Uuid
  tenantId      String    @db.Uuid
  patientId     String    @db.Uuid
  invoiceId     String?   @db.Uuid
  statementDate DateTime  @db.Timestamptz()
  openingBalance Decimal @db.Decimal(12, 2)
  closingBalance Decimal @db.Decimal(12, 2)
  pdfUrl        String?
  createdAt     DateTime  @default(now()) @db.Timestamptz()
}

model Receipt {
  id            String    @id @default(uuid()) @db.Uuid
  tenantId      String    @db.Uuid
  paymentId     String    @db.Uuid
  receiptNumber String    @unique
  receiptDate   DateTime  @db.Timestamptz()
  amount        Decimal   @db.Decimal(12, 2)
  pdfUrl        String?
  createdAt     DateTime  @default(now()) @db.Timestamptz()
}

// Add missing relations
model Provider {
  user   User?   @relation(fields: [userId], references: [id], onDelete: SetNull)
  userId String? @db.Uuid
}

model Chair {
  location   Location? @relation(fields: [locationId], references: [id], onDelete: SetNull)
  locationId String?  @db.Uuid
}
```

---

*This document should be updated as remediation progresses.*
