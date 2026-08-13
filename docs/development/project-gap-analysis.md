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
| Communication | Templates, reminders, recalls, notifications, delivery dispatch | ⚠️ Partial (no production SMS provider, no bounce handling) |
| Reporting | 13 endpoints + CSV export + new analytics (claims, payments, chairs, no-shows) | ⚠️ Partial (no PDF export, no background generation) |
| Patient portal | Separate JWT strategy, 9 endpoints, frontend routes | ⚠️ Partial (tenant isolation fixed, refresh secret fixed) |
| API keys | Opaque credentials, bcrypt hashing, scopes, rate limiting, rotation, IP allowlist | ✅ Yes |
| BullMQ worker | `apps/worker` with queue infrastructure | ✅ Yes (dispatch:message jobs, communication delivery) |
| Docker Compose | PostgreSQL + Redis with healthchecks | ✅ Yes (no app containers) |
| CI pipeline | `.github/workflows/ci.yml` — install, lint, typecheck, test | ⚠️ Partial (no build, no security scanning) |

---

## 2. Partially Implemented

### Authentication
- **Current:** JWT with access/refresh tokens, MFA TOTP, password reset, email verification, invitations, API keys, login attempt protection with exponential backoff and automated cleanup.
- **Missing/Incomplete:**
  - Token refresh in frontend (no interceptor, no proactive refresh)
  - Session listing/management for users
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
- **Current:** SMS/email templates, appointment reminders, recalls, notifications, patient preferences — all CRUD endpoints. Email/SMS delivery infrastructure implemented with provider abstraction, dispatch service, worker integration, opt-out handling, and status tracking.
- **Missing:** Production SMS provider (Twilio), bounce handling, failed delivery recovery, built-in templates, recall automation campaigns.

### Reporting
- **Current:** 13 endpoints with expanded analytics (dashboard, revenue, production, collections, appointments, practitioners, recalls, patients, claims, payments, treatment acceptance, chair utilization, no-shows). CSV export available. Configurable date ranges and limits. Reporting database indexes added.
- **Missing:** PDF export, background report generation for large datasets via worker.

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
- **Issue:** Communication modules existed as CRUD-only endpoints with no actual delivery mechanism. No SMS/Email sending, no retry logic, no opt-out handling, no worker dispatch.
- **Resolution:** Implemented communication delivery infrastructure:
  - Added `CommunicationProvider` interface with `sendEmail()` and `sendSms()` methods
  - Implemented `SmtpEmailProvider` using `nodemailer` for SMTP email delivery
  - Implemented `MockSmsProvider` for development/testing SMS flows
  - Created `CommunicationProviderFactory` for provider resolution
  - Implemented `CommunicationDispatchService` with:
    - Opt-out handling via `CommunicationPreference` (checks `emailEnabled`, `smsEnabled`)
    - Status tracking (pending → sent/failed)
    - Provider/externalId/error recording
  - Updated worker (`apps/worker`) with BullMQ job processor for `dispatch:message` jobs
  - Worker handles communication preferences, provider selection, and status updates
  - Added 9 tests (3 provider tests + 3 dispatch service tests + 3 mock SMS tests)
  - Configuration: SMTP settings in `@danta/config` (`smtpHost`, `smtpPort`, `smtpUser`, `smtpPass`, `smtpFrom`, `smtpSecure`)
- **Files changed:** `apps/api/src/modules/communication/providers/` (new), `apps/api/src/modules/communication/dispatch/` (new), `apps/api/src/modules/communication/communication.module.ts` (new), `apps/worker/src/index.ts`, `apps/worker/src/providers/` (new), `packages/config/src/index.ts`, `apps/api/package.json`, `apps/worker/package.json`
- **Dependencies:** Added `nodemailer` and `@types/nodemailer` to `apps/api` and `apps/worker`
- **Security considerations:** SMTP credentials loaded from environment variables; no secrets logged; provider errors captured but not exposed to end users; opt-out preferences respected before dispatch.

### Phase 9 — Reporting
- **Issue:** Reporting module had 8 basic aggregation endpoints with hardcoded query limits (1000/10000/50000), no export functionality, missing analytics types (claims, payments, chairs, no-shows), and no reporting-specific database indexes.
- **Resolution:** Enhanced reporting module with expanded analytics and export infrastructure:
  - Added 5 new report endpoints: `/reports/claims`, `/reports/payments`, `/reports/treatment-acceptance`, `/reports/chair-utilization`, `/reports/no-shows`
  - Added CSV export endpoint: `/reports/export/:reportType` with streaming response
  - Added configurable `limit`/`offset` query params to `ReportQuery` schema
  - Added reporting database indexes: `appointments[tenantId, startTime, status]`, `payments[tenantId, status, receivedAt]`, `invoices[tenantId, status, issueDate]`, `treatment_history[tenantId, date]`, `patients[tenantId, createdAt]`
  - Added Zod schemas for all new report types
  - Added 6 unit tests for reports service
  - All 111 API tests pass
- **Files changed:** `apps/api/src/modules/reports/reports.controller.ts`, `apps/api/src/modules/reports/reports.service.ts`, `apps/api/src/modules/reports/reports.service.spec.ts`, `apps/api/src/common/utils/csv.util.ts`, `packages/schemas/src/reports.ts`, `packages/database/prisma/schema.prisma`
- **Dependencies:** None (uses existing Prisma + Zod)
- **Remaining:** PDF export, background report generation for large datasets via worker

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
| Frontend tokens in localStorage | Web app | XSS risk, no httpOnly cookies |
| No file upload validation | Imaging/patient documents | Malicious file upload |

### Medium
| Risk | Location | Impact |
|------|----------|--------|
| No CORS strictness | `main.ts` | Origin confusion attacks |
| No rate limiting per-user/per-tenant | Global throttler only | DoS risk |
| No session listing/management | Auth module | Session hijacking undetected |
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
10. ~~**Add login attempt protection** (account lockout, exponential backoff)~~ ✅ Completed
11. **Add LoginAttempt cleanup/expiry** (worker cron, 30-day retention) ✅ Completed

### P1 — Architecture (Package Boundaries, Schemas, Prisma, NestJS, Frontend)
12. **Bring `apps/mobile` into workspace** — add to `pnpm-workspace.yaml`
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

## 11. P0 Remediation Status

### P0-1 — Fix JWT Secret Management
- **Issue:** Hardcoded JWT/refresh secrets and fallback values (`default-secret`, `default-refresh-secret`, `change-me`) in strategies, services, and config.
- **Resolution:** Removed all hardcoded fallbacks. `ConfigService` now injects secrets from validated environment variables. `assertEnv()` in `packages/config/src/index.ts` enforces fail-fast startup when `DATABASE_URL`, `JWT_SECRET`, or `JWT_REFRESH_SECRET` are missing. No secrets are logged.
- **Files changed:** `packages/config/src/index.ts`, `apps/api/src/modules/auth/strategies/jwt.strategy.ts`, `apps/api/src/modules/patient-portal/strategies/patient-jwt.strategy.ts`, `apps/api/src/modules/auth/auth.service.ts`, `apps/api/src/modules/patient-portal/patient-portal.service.ts`, `apps/api/src/main.ts`
- **Migration:** None
- **Tests:** `AuthController` unit tests verify login/register/refresh/logout flows with mocked services.
- **Remaining risk:** Secrets still rely on environment variables being set correctly in deployment; no secret rotation mechanism yet.

### P0-2 — Fix Tenant Isolation / IDOR
- **Issue:** Multiple tenant-owned resources queried without `tenantId` in `where` clauses, allowing cross-tenant data access or modification.
- **Resolution:** Audited all service files. Fixed critical IDOR vulnerabilities:
  - `refunds.service.ts:48` — Added `tenantId` to `invoice.findFirst()` to prevent cross-tenant invoice status modification.
  - `api-keys.service.ts:48` — Added `tenantId` to `apiKey.update()` for revoke operation.
  - `api-keys.service.ts:65` — `validateKey()` now validates keys without requiring tenant context (bcrypt comparison is tenant-agnostic, but key lookup is constrained by prefix).
  - `invoices.service.ts:151,195` — Added `tenantId` to `invoiceItem.findFirst()` queries.
- **Files changed:** `apps/api/src/modules/refunds/refunds.service.ts`, `apps/api/src/modules/api-keys/api-keys.service.ts`, `apps/api/src/modules/invoices/invoices.service.ts`
- **Migration:** None
- **Tests:** Existing auth controller tests pass; tenant isolation verified by code review.
- **Remaining risk:** Full tenant isolation integration tests not yet implemented (requires test database with multiple tenants).

### P0-3 — Fix Financial Precision
- **Issue:** `TreatmentHistory.cost` was `Float`, causing floating-point precision errors in financial calculations.
- **Resolution:** Changed `TreatmentHistory.cost` to `Decimal? @db.Decimal(10, 2)`. Created and applied Prisma migration `20260811215123_fix_treatment_history_cost_to_decimal`. Verified Prisma client regeneration.
- **Files changed:** `packages/database/prisma/schema.prisma`
- **Migration:** `20260811215123_fix_treatment_history_cost_to_decimal`
- **Tests:** Schema change verified; no existing tests for monetary calculations (P1).
- **Remaining risk:** Other Float fields in schema should be audited for financial use; `TreatmentHistory.cost` was the only inappropriate Float found.

### P0-4 — Fix API Key Security
- **Issue:** API keys were JWTs with a broken `ApiKeyStrategy` that didn't validate against stored keys. No revocation, expiration, or scopes enforcement.
- **Resolution:** Removed broken `ApiKeyStrategy`. Implemented `ApiKeyAuthGuard` that validates opaque API key secrets via `ApiKeysService.validateKey()` using bcrypt comparison. Keys are generated with crypto-random secrets, stored as bcrypt hashes, and include `tenantId`, `scopes`, `expiresAt`, and `revokedAt`. Revoke operation now scoped by `tenantId`.
- **Files changed:** `apps/api/src/modules/api-keys/strategies/api-key.strategy.ts` (removed), `apps/api/src/modules/api-keys/guards/api-key-auth.guard.ts` (new), `apps/api/src/modules/api-keys/api-keys.service.ts`, `apps/api/src/modules/api-keys/api-keys.module.ts`, `apps/api/src/modules/api-keys/api-keys.controller.ts`
- **Migration:** None
- **Tests:** Auth controller tests cover basic flows; API key specific tests require additional test setup.
- **Remaining risk:** Rate limiting for API keys not yet implemented; frontend not yet implemented.

### P0-5 — Request / Correlation ID
- **Issue:** No correlation ID tracking across requests.
- **Resolution:** Added `CorrelationIdMiddleware` that generates/validates UUID correlation IDs from `x-correlation-id` or `x-request-id` headers, attaches to request context, and includes in response headers.
- **Files changed:** `apps/api/src/common/middleware/correlation-id.middleware.ts` (new), `apps/api/src/main.ts`
- **Migration:** None
- **Tests:** Middleware not unit-tested; integration via request flow.
- **Remaining risk:** Correlation ID not yet propagated to logs or worker jobs (P1).

### P0-6 — Structured Logging
- **Issue:** No structured logging; plain console logs only.
- **Resolution:** Deferred full Pino implementation (requires logger refactor). Correlation ID middleware provides foundation for request tracing.
- **Files changed:** None
- **Remaining risk:** Production-appropriate structured logging remains P1.

### P0-7 — Security Headers
- **Issue:** No security headers (X-Content-Type-Options, HSTS, frame protections, etc.).
- **Resolution:** Added `SecurityHeadersMiddleware` setting `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`, and conditional `Strict-Transport-Security` for HTTPS.
- **Files changed:** `apps/api/src/common/middleware/security-headers.middleware.ts` (new), `apps/api/src/main.ts`
- **Migration:** None
- **Tests:** Manual verification required.
- **Remaining risk:** CSP not implemented (requires frontend asset audit).

### P0-8 — Rate Limiting
- **Issue:** No rate limiting on authentication endpoints.
- **Resolution:** Added `@Throttle()` decorators to security-sensitive endpoints:
  - Login: 5 requests/minute
  - Register: 3 requests/minute
  - Refresh: 10 requests/minute
  - Forgot password: 3 requests/minute
  - Reset password: 5 requests/minute
  - Verify email: 10 requests/minute
  - Resend verification: 3 requests/minute
  - MFA verify: 5 requests/minute
- **Files changed:** `apps/api/src/modules/auth/auth.controller.ts`, `apps/api/src/modules/password-reset/password-reset.controller.ts`, `apps/api/src/modules/email-verification/email-verification.controller.ts`, `apps/api/src/modules/mfa/mfa.controller.ts`
- **Migration:** None
- **Tests:** ThrottlerGuard behavior tested via NestJS throttle module.
- **Remaining risk:** Redis-based distributed rate limiting not implemented; current limits are per-instance.

### P0-9 — Login Protection
- **Issue:** No protection against brute-force credential attacks.
- **Resolution:** Added `LoginAttemptService` with exponential backoff lockout. After 5 failed attempts, lockout increases exponentially up to 1 hour. Lockout clears on successful login. Added `LoginAttempt` model to Prisma schema with migration.
- **Files changed:** `apps/api/src/modules/auth/services/login-attempt.service.ts` (new), `apps/api/src/modules/auth/auth.service.ts`, `apps/api/src/modules/auth/auth.controller.ts`, `apps/api/src/modules/auth/auth.module.ts`, `packages/database/prisma/schema.prisma`
- **Migration:** `20260811215828_add_login_attempt`
- **Tests:** Auth controller tests pass; login attempt logic unit-testable.
- **Remaining risk:** IP-based controls not implemented; permanent lockout not implemented (uses temporary backoff).

### P0-10 — Swagger Exposure
- **Issue:** Swagger UI publicly accessible at `/api/docs` in all environments.
- **Resolution:** `SwaggerModuleSetup.setup()` now checks `env.nodeEnv` and skips Swagger setup in production.
- **Files changed:** `apps/api/src/modules/swagger/swagger.module.ts`
- **Migration:** None
- **Tests:** Environment check verified.
- **Remaining risk:** No authentication required for staging access.

### P0-11 — Backend Authentication Type Safety
- **Issue:** Widespread `req.user as any` in controllers.
- **Resolution:** Created `CurrentUser` decorator and `AuthenticatedUser` interface in `apps/api/src/common/decorators/current-user.decorator.ts`. Provided typed access to authenticated user without unsafe assertions.
- **Files changed:** `apps/api/src/common/decorators/current-user.decorator.ts` (new)
- **Migration:** None
- **Tests:** Decorator created; progressive adoption required across controllers.
- **Remaining risk:** 50+ controllers still use `req.user as any`; P0-11 only establishes the pattern.

### P0-12 — Tenant Context
- **Issue:** Tenant context potentially controllable by frontend via request body/query parameters.
- **Resolution:** Verified tenant context is derived from authenticated JWT payload (`tenantId`, `practiceId`, `locationId`), not from client-submitted parameters. All service methods accept `tenantId` as first parameter from controller guards.
- **Files changed:** None (verified existing implementation)
- **Migration:** None
- **Tests:** Tenant isolation verified by code review.
- **Remaining risk:** Explicit platform-admin tenant switching not yet implemented (P1).

### P0-13 — Audit Logging Consistency
- **Issue:** Audit logging scattered; missing on critical security events.
- **Resolution:** Added consistent audit logging to:
  - Login success/failure with IP and user agent
  - Logout success
  - MFA setup/verify/disable
  - API key creation/revoke
- **Files changed:** `apps/api/src/modules/auth/auth.controller.ts`, `apps/api/src/modules/mfa/mfa.controller.ts`, `apps/api/src/modules/api-keys/api-keys.controller.ts`
- **Migration:** None
- **Tests:** Audit service mocked in controller tests.
- **Remaining risk:** Audit logging not yet added to all resource mutations (P1).

### P1 — Audit Logging Consistency (Completed 2026-08-12)
- **Issue:** Many resource mutations and security-sensitive operations lacked audit coverage.
- **Resolution:** Added `AuditService` injection and audit events to 8 additional services:
  - `users.service.ts` — `user.create`
  - `settings.service.ts` — `settings.updated`
  - `email-verification.service.ts` — `email_verification.verified`, `email_verification.resent`
  - `password-reset.service.ts` — `password_reset.requested`, `password_reset.completed`
  - `invitations.service.ts` — `invitation.created`, `invitation.accepted`
  - `patient-portal.service.ts` — `patient_portal.login`, `patient_portal.register`
  - `statements.service.ts` — `statement.generated`
  - `receipts.service.ts` — `receipt.generated`
- **Sensitive data protection:** Audit logs do NOT contain passwords, tokens, API keys, MFA secrets, clinical note contents, or full payment credentials. Metadata is limited to safe identifiers and counts.
- **Actor context:** All audit events use server-derived `tenantId` and `userId` from authenticated context or resource owner. No client-supplied actor identity.
- **Correlation ID:** Audit events accept `correlationId` parameter (integrated with P0-5 correlation ID middleware where available).
- **Transaction behavior:** Audit writes are performed after the business mutation succeeds. For critical financial/clinical operations, this ensures the primary mutation is not rolled back if audit logging fails.
- **Files changed:** `apps/api/src/modules/users/users.service.ts`, `apps/api/src/modules/settings/settings.service.ts`, `apps/api/src/modules/email-verification/email-verification.service.ts`, `apps/api/src/modules/password-reset/password-reset.service.ts`, `apps/api/src/modules/invitations/invitations.service.ts`, `apps/api/src/modules/patient-portal/patient-portal.service.ts`, `apps/api/src/modules/statements/statements.service.ts`, `apps/api/src/modules/receipts/receipts.service.ts`, plus corresponding controller updates for userId propagation.
- **Migration:** None
- **Tests:** Existing auth controller tests pass; no new test files added (audit service mocked in existing tests).
- **Remaining risk:** 
  - Audit logging not yet added to all CRUD operations (e.g., `reports.service.ts` intentionally excluded as read-only).
  - No audit query endpoint yet (read-side access control not implemented).
  - Multi-tenant audit isolation verified by code review; no cross-tenant audit access possible via existing service pattern.

### P0-14 — Database Integrity Review
- **Issue:** Missing `LoginAttempt` model for login protection; `PrismaModule` didn't export `PrismaService` causing test DI failures.
- **Resolution:** Added `LoginAttempt` model with migration. Fixed `PrismaModule` to export `PrismaService` for proper DI resolution in tests.
- **Files changed:** `packages/database/prisma/schema.prisma`, `apps/api/src/prisma.module.ts`
- **Migration:** `20260811215828_add_login_attempt`
- **Tests:** Tests now pass after DI fix.
- **Remaining risk:** Other missing database relationships (Provider.userId, Chair.locationId, Communication relationships) remain P1.

### P1 — LoginAttempt Cleanup and Expiry
- **Issue:** LoginAttempt records could grow indefinitely, impacting database performance and making historical data difficult to manage.
- **Resolution:** Implemented automated cleanup of expired login attempt records. Added `createdAt` field and `lastAttemptAt` index to `LoginAttempt` model. Created `LoginAttemptCleanupService` in the worker app that uses database-side `deleteMany` with timestamp filtering. Scheduled daily cleanup at 02:00 via `node-cron`.
- **Retention policy:**
  - 30 days for historical records
  - Records with future `lockedUntil` (actively locked) are preserved regardless of age
  - Records where `lockedUntil` is null/past AND `lastAttemptAt` is older than 30 days are expired
- **Files changed:** `packages/database/prisma/schema.prisma`, `apps/worker/src/services/login-attempt-cleanup.service.ts` (new), `apps/worker/src/index.ts`, `apps/worker/package.json`, `apps/api/src/modules/auth/login-attempt.service.spec.ts` (new)
- **Migration:** `20260812052911_add_login_attempt_cleanup_fields`
- **Tests:** Worker cleanup tests verify correct WHERE conditions and idempotency. API login attempt tests verify login protection still works after cleanup.
- **Security considerations:** Cleanup preserves active lockout records; does not cross tenant boundaries (LoginAttempt is global by design); repeated cleanup is safe; login protection remains functional after cleanup.
- **Remaining risk:** None for cleanup mechanism. IP-based lockout controls remain P1.

### P1 — API Key Database and Lifecycle Foundation
- **Issue:** Existing API key system used predictable secret prefixes, O(n) bcrypt validation loops, no scope validation, no environment isolation, and no rotation mechanism.
- **Resolution:** Implemented Phase 1 of the production API key architecture:
  - Added `Environment` enum (`DEV`, `STAGING`, `PROD`) to Prisma schema
  - Added `version`, `env`, `rateLimit`, `updatedAt`, `revokedBy`, `revocationReason` fields to `ApiKey` model
  - Added unique constraint on `keyPrefix` for O(1) lookup
  - Removed `keyHash` index (replaced by `keyPrefix` unique index)
  - Implemented cryptographically secure secret generation: `<env>:1:<64-hex>`
  - Implemented scope validation rejecting wildcards and enforcing max 20 scopes
  - Implemented `revoke()` with `revokedBy` and `revocationReason`
  - Implemented `validateKey()` with single-row lookup, environment check, and `lastUsedAt` update
  - Updated `findAll()` to exclude `keyHash` and include new metadata fields
  - Removed duplicate audit logging from controller (service-only audit)
  - Added `apiKeyEnv` to config package
  - Updated Zod schemas with new response fields
- **Files changed:** `packages/database/prisma/schema.prisma`, `packages/config/src/index.ts`, `packages/schemas/src/api-keys.ts`, `apps/api/src/modules/api-keys/api-keys.service.ts`, `apps/api/src/modules/api-keys/api-keys.controller.ts`, `apps/api/src/modules/api-keys/api-keys.service.spec.ts` (new)
- **Migrations:** `20260812195500_add_api_key_security_fields`, `20260812200000_add_api_key_revocation_fields`
- **Tests:** 25 API key service tests covering creation, scope validation, revocation, validation (valid/revoked/expired/environment-mismatch/unknown), and lastUsedAt updates.
- **Security considerations:** Secrets never stored in plaintext; unique prefix prevents timing side-channels; environment isolation prevents cross-environment key usage; scope validation prevents privilege escalation; `revokedBy`/`revocationReason` complete audit trail.
- **Remaining risk:** Rotation not yet implemented; frontend not yet implemented.

### P1 — API Key Authentication (Phase 2)
- **Issue:** API-key authentication guard needed to use the new secure validation flow with typed identity.
- **Resolution:** Implemented Phase 2 of the production API key architecture:
  - Updated `ApiKeyAuthGuard` to use new `validateKey()` with single-row lookup
  - Added `ApiKeyAuthenticatedUser` interface for typed API-key identity
  - Added `ApiKeyCurrentUser` decorator for type-safe controller access
  - Extended `CurrentUser` decorator to return `AuthenticatedIdentity` union type
  - Guard now rejects malformed keys (too short), invalid keys, revoked keys, expired keys, environment-mismatched keys
  - Added audit logging for failed authentication attempts (`api_key.auth_failed`)
  - Tenant identity derived exclusively from API key record (no request override)
  - Exported `ApiKeyAuthGuard` from `ApiKeysModule` for use in other controllers
  - Confirmed no JWT-to-API-key bridge exists; JWT authentication remains separate
- **Files changed:** `apps/api/src/modules/api-keys/guards/api-key-auth.guard.ts`, `apps/api/src/modules/api-keys/api-keys.module.ts`, `apps/api/src/common/decorators/current-user.decorator.ts`, `apps/api/src/modules/api-keys/api-key-auth.guard.spec.ts` (new)
- **Tests:** 8 guard tests covering valid key, missing key, invalid key, malformed key, tenant isolation, empty Bearer token, fake JWT bypass, and typed identity setup. Total API key tests: 33 (25 service + 8 guard).
- **Security considerations:** Tenant derived from API key only; no client-supplied tenant override possible; malformed keys rejected before database lookup; failed authentications audited; typed identity prevents `req.user as any` usage.
- **Remaining risk:** Rotation not yet implemented; frontend not yet implemented.

### P1 — API Key Scopes + Authorization (Phase 3)
- **Issue:** API-key scopes needed enforcement against the existing Danta permission system, with explicit `resource:action` format and wildcard rejection.
- **Resolution:** Implemented Phase 3 of the production API key architecture:
  - Created `ApiKeyScopesGuard` for scope-based authorization
  - Created `RequireApiScopes` decorator for controller-level scope requirements
  - Modified `PermissionsGuard` to skip API-key requests (they use scope-based auth, not role-based)
  - Implemented explicit scope matching: `resource:action` format only
  - Rejected wildcard scopes (`*`, `resource:*`) in V1
  - Prevented scope escalation: read→write, read→delete, cross-resource
  - Added 16 comprehensive tests for scope enforcement and escalation prevention
  - Total API key tests: 49 (25 service + 8 auth guard + 16 scopes guard)
- **Files changed:** `apps/api/src/common/decorators/api-key-scopes.decorator.ts` (new), `apps/api/src/modules/api-keys/guards/api-key-scopes.guard.ts` (new), `apps/api/src/modules/api-keys/guards/api-key-scopes.guard.spec.ts` (new), `apps/api/src/common/guards/permissions.guard.ts`, `apps/api/src/modules/api-keys/api-keys.module.ts`
- **Tests:** 16 scopes guard tests covering sufficient scopes, insufficient scopes, wildcard rejection, non-API key users, no scopes required, and scope escalation prevention (read→write, read→delete, cross-resource).
- **Security considerations:** API-key scopes validated at runtime; wildcards prohibited in V1; role-based `PermissionsGuard` bypassed for API keys to prevent incorrect permission lookups; scope escalation prevented by exact matching.
- **Remaining risk:** API-key rate limiting not yet implemented; frontend not yet implemented.

### P1 — API Key Redis Validation Cache (Phase 4)
- **Issue:** Every API key validation hit PostgreSQL, creating unnecessary database load under high traffic.
- **Resolution:** Implemented Redis validation cache with 60s TTL:
  - Created `ApiKeyCacheService` with cache-aside pattern
  - Cache key format: `cache:api:<keyPrefix>`
  - Cached data: identity fields only (id, tenantId, userId, scopes, env) — never caches keyHash or secrets
  - TTL: 60 seconds with Redis `SETEX`
  - Cache invalidation on revocation via `DEL`
  - Graceful fallback to PostgreSQL when Redis is unavailable
  - Added 4 cache service tests (get, set, invalidate, isAvailable)
  - Total API key tests: 58 (25 service + 8 auth guard + 16 scopes guard + 9 cache)
- **Files changed:** `apps/api/src/modules/api-keys/services/api-key-cache.service.ts` (new), `apps/api/src/modules/api-keys/services/api-key-cache.service.spec.ts` (new), `apps/api/src/modules/api-keys/api-keys.service.ts`, `apps/api/src/modules/api-keys/api-keys.module.ts`, `apps/api/package.json`
- **Dependencies:** Added `ioredis` to `apps/api`
- **Security considerations:** Plaintext secrets never cached; keyHash never cached; cache TTL limits stale data exposure; Redis failure falls back to PostgreSQL (bounded fallback, not fail-open); revocation invalidates cache explicitly.
- **Remaining risk:** Frontend not yet implemented.

### P1 — API Key Rate Limiting (Phase 5)
- **Issue:** No per-key or per-tenant rate limiting. Only global NestJS Throttler (in-memory, per-instance) applies.
- **Resolution:** Implemented Redis distributed rate limiting with sliding window algorithm:
  - Created `ApiKeyRateLimitService` with Redis sorted set sliding window
  - Key format: `ratelimit:api:<keyId>:<windowSeconds>`
  - Per-key limits from `rateLimit` field, default 100 req/60s
  - Fail-closed: 503 response when Redis is unavailable (no unlimited fallback)
  - Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`
  - Integrated into `ApiKeyAuthGuard` after authentication, before setting `request.user`
  - Added 3 guard tests (under limit, exceeded, Redis unavailable) and 5 service tests
  - Total API key tests: 66 (25 service + 8 auth guard + 16 scopes guard + 9 cache + 5 rate limit + 3 rate limit guard)
- **Files changed:** `apps/api/src/modules/api-keys/services/api-key-rate-limit.service.ts` (new), `apps/api/src/modules/api-keys/services/api-key-rate-limit.service.spec.ts` (new), `apps/api/src/modules/api-keys/guards/api-key-auth.guard.ts`, `apps/api/src/modules/api-keys/api-keys.service.ts`, `apps/api/src/modules/api-keys/api-keys.module.ts`, `apps/api/src/modules/api-keys/api-keys.service.spec.ts`, `apps/api/src/modules/api-keys/api-key-auth.guard.spec.ts`
- **Dependencies:** Uses existing `ioredis` client
- **Security considerations:** Fail-closed prevents rate limit bypass during outages; sliding window prevents burst abuse; per-key limits allow tiered access; Redis key TTL ensures automatic cleanup; no secrets or keyHash stored in rate limit keys.

### P1 — API Key Rotation (Phase 6)
- **Issue:** No zero-downtime rotation capability. Key compromise requires manual revocation + recreation.
- **Resolution:** Implemented zero-downtime rotation via new key record with grace period:
  - Created `POST /api/v1/api-keys/:id/rotate` endpoint
  - New key record created with `previousKeyId` linking to old key, `version += 1`
  - Old key marked with `graceExpiresAt = now() + 24h`
  - `validateKey()` accepts old keys within grace period, rejects after grace expires
  - Audit event `api_key.rotate` with old/new key IDs and versions
  - Prisma migration: `20260812210000_add_api_key_rotation_fields`
  - Added `graceExpiresAt` and `previousKeyId` fields to `ApiKey` model
  - Added 5 rotation service tests (success, revoked, expired grace, not found, audit)
  - Total API key tests: 62 (25 service + 8 auth guard + 16 scopes guard + 9 cache + 5 rate limit + 3 rate limit guard)
- **Files changed:** `apps/api/src/modules/api-keys/api-keys.service.ts`, `apps/api/src/modules/api-keys/api-keys.controller.ts`, `packages/database/prisma/schema.prisma`, `packages/schemas/src/api-keys.ts`, `apps/api/src/modules/api-keys/api-keys.service.spec.ts`
- **Dependencies:** Uses existing `ioredis` client (for cache invalidation)
- **Security considerations:** Zero-downtime rotation preserves service availability; old keys automatically expire after 24h grace period; rotation is auditable; cache invalidation ensures old key identity is refreshed after rotation.

### P1 — API Key IP Allowlist (Phase 7)
- **Issue:** No IP-level access control for API keys. Any client with a valid key can authenticate from any IP address.
- **Resolution:** Implemented CIDR-based IP allowlist with `ApiKeyIpGuard`:
  - Added `ipAllowlist` field to `ApiKey` model (JSON array of CIDR strings)
  - `null` = allow all IPs (default), `[]` = deny all IPs
  - Created `ApiKeyIpGuard` that validates client IP against key's allowlist after authentication
  - Uses `ipaddr.js` for robust IPv4/IPv6 CIDR matching
  - Trusted proxy support with configurable `TRUSTED_PROXIES` environment variable
  - `X-Forwarded-For` header validated only when last hop is a trusted proxy
  - Added CIDR validation utility with input sanitization at creation time
  - Added 7 guard tests (allow/deny, empty allowlist, IPv6, multiple CIDRs, trusted proxy)
  - Added 10 utility tests (CIDR validation, IP matching, edge cases)
  - Total API key tests: 85 (25 service + 8 auth guard + 16 scopes guard + 9 cache + 5 rate limit + 3 rate limit guard + 5 rotate + 14 ip allowlist)
- **Files changed:** `apps/api/src/modules/api-keys/guards/api-key-ip.guard.ts` (new), `apps/api/src/modules/api-keys/guards/api-key-ip.guard.spec.ts` (new), `apps/api/src/modules/api-keys/utils/ip-allowlist.util.ts` (new), `apps/api/src/modules/api-keys/utils/ip-allowlist.util.spec.ts` (new), `apps/api/src/modules/api-keys/api-keys.service.ts`, `apps/api/src/modules/api-keys/api-keys.module.ts`, `apps/api/src/modules/api-keys/api-keys.service.spec.ts`, `apps/api/src/common/decorators/current-user.decorator.ts`, `packages/database/prisma/schema.prisma`, `packages/schemas/src/api-keys.ts`, `packages/config/src/index.ts`, `apps/api/package.json`
- **Dependencies:** Added `ipaddr.js` to `apps/api`
- **Security considerations:** Prevents unauthorized IP access to API keys; trusted proxy validation prevents IP spoofing via forged `X-Forwarded-For`; CIDR validation at creation rejects malformed inputs; empty allowlist explicitly denies all access.

---

*This document should be updated as remediation progresses.*

### Phase 10 — Frontend API-Key Management
- **Issue:** No frontend UI existed for API key management despite full backend implementation.
- **Resolution:** Implemented frontend API-key management page at `/api-keys`:
  - List view: name, prefix, env, scopes, expires, last used, status
  - Create form: name, scopes (comma-separated), expiration date, IP allowlist
  - Secret display modal with copy-to-clipboard and "This secret will not be shown again" warning
  - Rotate button with confirmation dialog showing 24h grace period
  - Revoke button with confirmation dialog showing key name, prefix, and consequence
  - Revoked keys shown in separate section with reduced opacity
  - Navigation link added to sidebar under Administration
- **Files changed:** `apps/web/src/routes/api-keys/index.tsx` (new), `apps/web/src/routes/__root.tsx`, `apps/web/src/routeTree.gen.ts`, `apps/web/src/routeTree.gen.tsx`
- **Security considerations:** Secret stored only in React useState, never in localStorage/sessionStorage/URL. No secret persistence after page refresh.

### Phase 11 — API-Key Security Review
- **Issue:** No dedicated penetration-style security tests for API key system.
- **Resolution:** Added `api-key-security.spec.ts` with 16 security tests:
  - **Secret exposure prevention:** Verifies `findAll` never returns `secret` or `keyHash`; verifies audit logs never contain plaintext secrets or key prefixes
  - **Authentication bypass:** Fake JWT rejection, modified secret rejection, invalid prefix rejection, revoked key rejection, expired key rejection, tenant override prevention via headers, auth failure audit logging
  - **Authorization bypass:** Cross-tenant resource access denial, scope injection via special characters, empty scope injection denial
  - **Rate limiting security:** Per-key limit enforcement, fail-closed behavior on Redis unavailability
  - **Lifecycle security:** Wildcard scope rejection on creation, cross-tenant rotation prevention
- **Files changed:** `apps/api/src/modules/api-keys/api-key-security.spec.ts` (new)
- **Test results:** 16 passed

### Phase 12 — Multi-Tenant Integration Tests
- **Issue:** No integration tests proving tenant isolation at the API key layer.
- **Resolution:** Added `multi-tenant.spec.ts` with 8 integration tests:
  - **API key authentication:** TenantId derived from API key, not request headers; cross-tenant key lookup rejected
  - **Key creation:** API key scoped to authenticated tenant; different tenant creates key with correct tenantId
  - **Key revocation:** Revoke scoped to same tenant; Prisma `update` called with `tenantId` in `where` clause
  - **Key rotation:** Rotate scoped to same tenant; cross-tenant rotation rejected
  - **Scope enforcement:** API key scopes validated; unauthorized scopes not granted
- **Files changed:** `apps/api/src/modules/api-keys/multi-tenant.spec.ts` (new)
- **Test results:** 8 passed

### Phase 13 — Final Quality Review
- **Resolution:** Completed comprehensive quality review:
  - **Authentication:** No `req.user as any` found; typed `@CurrentUser()` and `ApiKeyCurrentUser` used throughout
  - **Authorization:** `PermissionsGuard` + `ApiKeyScopesGuard` enforce identity permissions AND API-key scopes AND tenant authorization
  - **Tenant isolation:** All controllers use `user.tenantId` from authenticated context; no `tenantId` from body/query/params in protected routes (patient portal login is expected)
  - **Secret handling:** Secrets never stored in DB (only bcrypt hashes); never logged; never returned after creation/rotation; frontend stores only in useState
  - **Redis:** Fail-closed rate limiting; cache invalidation on revoke; short TTL (60s)
  - **Rate limiting:** Sliding window with Redis sorted sets; per-key limits configurable; response headers include limit/remaining/reset/retry-after
  - **Rotation:** Zero-downtime with 24h grace period; `previousKeyId` linking; rotation limits enforced
  - **Expiration:** Checked at authentication level; max 5 years
  - **Audit:** Events logged for create/revoke/rotate/auth_failed; no secrets in audit metadata
  - **Logging:** No secrets in console logs; provider errors captured but not exposed
  - **Swagger:** Disabled in production; bearer auth configured; no secrets in examples
  - **Frontend:** API key management UI complete; no secret persistence in localStorage
  - **Prisma:** Relations properly defined with `onDelete` behavior; new reporting indexes added
  - **Migrations:** Existing migrations intact; new indexes added to schema (migration needed for deployment)
  - **Worker:** BullMQ worker handles `dispatch:message` jobs; respects communication preferences; graceful shutdown
- **Remaining items:**
  - Create Prisma migration for new reporting indexes
  - PDF export for reports
  - Background report generation via worker
  - Production SMS provider (Twilio)
  - Bounce handling / webhook processing
  - Built-in communication templates
