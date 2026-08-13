# Danta — API Key Architecture Design

**Date:** 2026-08-12  
**Status:** Design document — not yet implemented  
**Scope:** Production API-key system for multi-tenant Australian dental SaaS

---

## 1. Existing Implementation Inspection

### 1.1 Prisma Model

```prisma
model ApiKey {
  id          String    @id @default(uuid()) @db.Uuid
  tenantId    String    @db.Uuid
  userId      String    @db.Uuid
  name        String    @db.VarChar(255)
  keyHash     String    @db.VarChar(255)
  keyPrefix   String    @db.VarChar(16)
  scopes      Json
  lastUsedAt  DateTime? @db.Timestamptz()
  expiresAt   DateTime? @db.Timestamptz()
  revokedAt   DateTime? @db.Timestamptz()
  createdAt   DateTime  @default(now()) @db.Timestamptz()

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("api_keys")
  @@index([tenantId])
  @@index([keyHash])
}
```

**Current indexes:**
- `tenantId` — tenant isolation queries
- `keyHash` — intended for lookup, but `validateKey()` does prefix scan + bcrypt loop instead

### 1.2 Service

**File:** `apps/api/src/modules/api-keys/api-keys.service.ts`

| Method | Behavior |
|--------|----------|
| `create()` | Generates `danta_<base64(userId)(8)>_<random(24)>`, bcrypt hashes secret, stores hash + prefix |
| `findAll(tenantId)` | Lists all keys for tenant |
| `revoke(tenantId, id, userId)` | Soft-delete via `revokedAt` |
| `validateKey(secret)` | Extracts prefix, queries all keys with prefix, bcrypt-compares each — **O(n) scan** |

### 1.3 Controller

**File:** `apps/api/src/modules/api-keys/api-keys.controller.ts`

- Protected by `JwtAuthGuard` + `PermissionsGuard`
- Requires `settings:manage` permission
- Endpoints: `POST /api/v1/api-keys`, `GET /api/v1/api-keys`, `POST /api/v1/api-keys/:id/revoke`
- Double audit logging (controller + service)

### 1.4 Guard

**File:** `apps/api/src/modules/api-keys/guards/api-key-auth.guard.ts`

- Extracts Bearer token
- Calls `validateKey()`
- Sets `request.user = { id, tenantId, scopes, type: 'api-key' }`
- **Does not update `lastUsedAt`**

### 1.5 Existing Infrastructure

| Component | Status |
|-----------|--------|
| Global prefix | `/api/v1` |
| Global guards | `ThrottlerGuard` (100 req/60s), `PermissionsGuard` |
| Audit logging | `AuditService` — action, resourceType, resourceId, metadata |
| Correlation ID | `CorrelationIdMiddleware` — `x-correlation-id` / `x-request-id` |
| Security headers | `SecurityHeadersMiddleware` |
| Redis | Available in worker; **not used in API** |
| Rate limiting | NestJS Throttler only — in-memory, per-instance |
| Zod validation | `ApiKeyCreateSchema` for creation |
| Tenant architecture | Organisation → Practice → Location → User |

---

## 2. Authorization Model

### 2.1 Evaluation Order

Every API-key-authenticated request must pass **all three** of the following checks, in this order:

```
1. Identity Permission
   ↓
   The user/service that created the API key must possess the underlying permission
   in the Danta permission system. API-key scopes cannot grant permissions that the
   owner does not have.

2. API-Key Scope
   ↓
   The API key must carry a scope that matches the requested resource:action.
   Scopes are a subset of the creator's permissions, not an independent system.

3. Tenant / Resource Authorization
   ↓
   The request must be authorized for the tenant, practice, and location derived
   from the API key. The key's tenantId is the authoritative tenant identity;
   request body/query/path parameters must NOT override tenant context.
```

**Formal expression:**

```
ALLOW = (user.hasPermission(requiredPermission))
     AND (apiKey.scopes.includes(requiredScope))
     AND (apiKey.tenantId == resource.tenantId)
     AND (apiKey is not revoked)
     AND (apiKey is not expired)
```

### 2.2 Integration with Existing Danta Permissions

Danta permissions are stored in the `permissions` table and assigned to roles. A user's effective permissions are the union of all permissions from their assigned roles.

API key scopes **must be derived from** and **cannot exceed** the creator's effective permissions at the time of key creation.

| Danta Permission | Valid API Key Scopes | Invalid Scopes |
|------------------|----------------------|----------------|
| `patients:read` | `patients:read` | `patients:write`, `patients:delete` |
| `patients:write` | `patients:read`, `patients:write` | `patients:delete`, `admin:*` |
| `appointments:read` | `appointments:read` | `appointments:write` |
| `settings:manage` | `settings:manage`, `admin:*` | — |

**Scope creation validation:**
When creating or updating an API key, the system must validate that every requested scope maps to a permission the creator currently holds. If the creator loses a permission later, the API key does **not** automatically lose that scope — it is a snapshot at creation time. However, the key cannot be used for actions outside the original permission boundary because the scope check fails.

### 2.3 Scope Enforcement Guard

New guard: `ApiKeyScopesGuard`

```typescript
@Controller('api/v1/patients')
@UseGuards(ApiKeyAuthGuard, ApiKeyScopesGuard)
@RequireApiScopes('patients:read')
export class PatientsController { ... }
```

**Behavior:**
1. Reads required scopes from `@RequireApiScopes()` decorator
2. Compares against `request.user.scopes` (set by `ApiKeyAuthGuard`)
3. Supports wildcard expansion: `patients:*` → `patients:read`, `patients:write`
4. If no scopes required on endpoint, allows all authenticated API keys
5. Does **not** query the `permissions` table — scope is a static property of the key

---

## 3. Scope Design

### 3.1 Scope Format

```
<resource>:<action>
```

Valid actions:

| Action | Meaning |
|--------|---------|
| `read` | GET, list, search, export |
| `create` | POST, import |
| `update` | PATCH, PUT |
| `delete` | DELETE, hard delete |
| `write` | Alias for `create` + `update` |

**Special actions (explicit, not wildcard):**
- `admin:read` — read admin settings
- `admin:write` — modify admin settings
- `reports:read` — access reporting endpoints

### 3.2 Wildcard Behavior

Wildcard scopes (`*`) are **prohibited for regular user-created keys**.

**Allowed only for:**
- Platform-admin-created service keys
- Keys created by users with `platform:admin` role

**Rules:**
- `patients:*` expands to `patients:read`, `patients:write`
- `appointments:*` expands to `appointments:read`, `appointments:write`
- `*:*` is **never allowed** — even for platform keys, explicit enumeration is required
- `billing:write` implies `billing:read` (implicit read on parent resource)

### 3.3 Scope Validation at Creation

```typescript
const creatorPermissions = await prisma.permission.findMany({
  where: {
    roles: {
      some: {
        role: {
          assignments: {
            some: { userId: creatorUserId },
          },
        },
      },
    },
  },
});

for (const scope of requestedScopes) {
  const [resource, action] = scope.split(':');
  if (action === '*') {
    // Prohibited unless creator is platform admin
    if (!isPlatformAdmin(creatorUser)) {
      throw new ForbiddenException('Wildcard scopes require platform admin');
    }
  } else {
    const hasPermission = creatorPermissions.some(
      (p) => p.resource === resource && (p.action === action || p.action === 'write' || p.action === 'manage'),
    );
    if (!hasPermission) {
      throw new ForbiddenException(`Creator lacks permission: ${scope}`);
    }
  }
}
```

---

## 4. Key Storage Design

### 4.1 Secret Format

```
<version>:<random>
```

Example: `1:<64-hex-chars>`

- **Version prefix** (`1:`) allows future algorithm rotation without breaking existing keys
- **Random portion** — 32 bytes → 64 hex characters via `crypto.randomBytes(32).toString('hex')`
- **Total length:** 66 characters
- **No tenant/user info in secret** — eliminates predictable patterns

### 4.2 Database Representation

| Column | Purpose |
|--------|---------|
| `keyHash` | bcrypt hash of full secret (`1:<64-hex>`) |
| `keyPrefix` | First 16 chars of secret — used for lookup index |
| `version` | Integer — supports algorithm rotation |
| `scopes` | JSON array of strings |
| `ipAllowlist` | JSON array of CIDR strings (nullable) |
| `rateLimit` | JSON object `{ max: number, windowMs: number }` (nullable) |

### 4.3 Key Generation Flow

```
1. Generate: secret = `1:${crypto.randomBytes(32).toString('hex')}`
2. Hash:     keyHash = bcrypt.hash(secret, 12)
3. Prefix:   keyPrefix = secret.slice(0, 16)  // "1:abc123..."
4. Store:    INSERT INTO api_keys (keyHash, keyPrefix, ...)
5. Return:   secret to user ONCE
```

### 4.4 Validation Flow

```
1. Extract prefix from incoming secret
2. Query: SELECT * FROM api_keys WHERE keyPrefix = $1 AND revokedAt IS NULL AND expiresAt > NOW()
3. For each candidate: bcrypt.compare(secret, keyHash)
4. On match: update lastUsedAt, return key
5. On no match: return null
```

**Security invariant:** The `keyPrefix` must be unique in the database. With a 16-character hex prefix drawn from a 66-character random secret, the probability of collision is negligible (< 2^-80 for 1 million keys), but a **unique database constraint** enforces this invariant.

---

## 5. Key Prefix Security

### 5.1 Entropy Analysis

- Secret: 32 bytes = 256 bits of entropy
- Prefix: 16 hex chars = 64 bits of entropy
- Collision probability (birthday bound) for N keys: ~N² / 2⁶⁵
- At 1,000,000 keys: ~1 in 3.7 × 10¹² — negligible
- **Conclusion:** 16-character prefix is safe and provides sufficient uniqueness

### 5.2 Why Prefix Lookup Is Safe

1. **Prefix is not the secret.** Even if an attacker learns a prefix, they cannot derive the full secret without a brute-force search over 2²⁵⁶ possibilities.
2. **Prefix exposure is low-risk.** The prefix is returned in API responses (`keyPrefix` field) and appears in audit logs. It is a stable identifier, not a credential.
3. **Database lookup identifies candidate; bcrypt verifies.** Even if two rows shared a prefix (which the unique constraint prevents), the bcrypt comparison is the security boundary, not the lookup.
4. **Enumeration resistance.** An attacker cannot enumerate all keys by guessing prefixes because the prefix space (16 hex chars = 4 billion combinations) is too large for practical enumeration, and the bcrypt comparison makes verification expensive.

### 5.3 Index Design

- **Unique index on `keyPrefix`** — O(1) single-row lookup
- **Removed `keyHash` index** — never queried directly; `keyPrefix` is the lookup key
- **`tenantId` index retained** — used for listing and tenant-scoped queries

---

## 6. Bcrypt vs Alternative Hashing

### 6.1 Options Evaluated

| Approach | Pros | Cons |
|----------|------|------|
| **bcrypt (cost 12)** | Slow by design, adaptive cost, constant-time compare, proven | ~60ms per verification on modern hardware |
| HMAC-SHA-256 + pepper | Fast, deterministic lookup possible | Pepper management complexity; single point of failure; not adaptive |
| SHA-256 / plain hash | Very fast | No work factor; unsuitable for secret hashing |
| Argon2id | Winner of PHC, memory-hard | Not universally available in all runtime environments; higher operational complexity |

### 6.2 Decision: **Keep bcrypt**

**Reasoning:**

1. **Entropy is sufficient.** The API key secret has 256 bits of randomness. Even with bcrypt's work factor, an attacker with the database cannot brute-force the preimage space.

2. **Verification latency is acceptable.** API-key validation happens once per request. At cost factor 12, bcrypt takes ~60ms on modern hardware. For typical API workloads (hundreds to thousands of req/s), this is acceptable. If performance becomes an issue, cost factor can be reduced to 10 or 8 after measuring actual load.

3. **Database compromise resistance.** If the database is leaked, bcrypt hashes are computationally expensive to crack. This is the primary threat model for stored secrets.

4. **Rate limiting complements hashing.** Even if bcrypt were fast, rate limiting prevents bulk verification attempts.

5. **No pepper management.** HMAC-SHA-256 requires a server-side pepper stored separately from the database. This adds operational complexity (secret rotation, multi-instance sync, backup considerations) without proportional benefit given the high key entropy.

**If performance becomes critical:** Consider reducing bcrypt cost factor to 10 or 8, or switching to a two-layer approach: bcrypt for storage + Redis cache for recent validations (with short TTL).

---

## 7. Rate Limiting Design

### 7.1 Redis Failure Behavior

**Decision: FAIL CLOSED for API-key rate limiting.**

When Redis is unavailable, API-key-authenticated requests must be **denied** with `503 Service Unavailable`.

**Rationale:**
- Rate limiting is a security control, not a performance optimization
- Failing open silently removes the rate limit protection
- A `503` response alerts operators to the infrastructure issue
- The global NestJS `ThrottlerGuard` (in-memory, per-instance) provides a **bounded emergency fallback** even when Redis is down for the rate-limit middleware

**No unlimited fallback is permitted.**

### 7.2 Limit Hierarchy

| Level | Scope | Default | Hard Limit | Purpose |
|-------|-------|---------|------------|---------|
| **Emergency fallback** | Per-instance, all requests | 100 req/60s | 100 req/60s | NestJS ThrottlerGuard when Redis is down |
| **Global API** | All API requests | 100 req/60s | 500 req/60s | General DoS protection |
| **Per-tenant** | All API-key requests for tenant | 1,000 req/60s | 10,000 req/60s | Prevent noisy-neighbor tenant |
| **Per-key** | Single API key | `rateLimit` field or 100 req/60s | 1,000 req/60s | Individual key protection |

### 7.3 Redis Implementation

**Key format:**
```
ratelimit:api:<keyId>:<window>
```

**Example:**
```
ratelimit:api:550e8400-e29b-41d4-a716-446655440000:60
```

**Sliding window algorithm:**
```
1. Determine window size from key's rateLimit or tenant default
2. Redis key: ratelimit:api:<keyId>:<windowSeconds>
3. ZADD current timestamp
4. ZREMRANGEBYSCORE windowStart
5. ZCARD = current count
6. If count > max: REJECT
7. Set TTL on key (window + 60s buffer)
```

**Why sorted sets instead of INCR/EXPIRE:**
- INCR/EXPIRE has a race condition under high concurrency
- Sorted sets provide true sliding window behavior
- More memory-efficient for short windows

### 7.4 Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1698765432
Retry-After: 32
```

### 7.5 Degraded Mode

| Redis State | API-Key Behavior | Global Behavior |
|-------------|------------------|-----------------|
| Available | Redis rate limit enforced | Redis rate limit enforced |
| Unavailable | **503 Service Unavailable** | NestJS ThrottlerGuard (in-memory, per-instance) |

---

## 8. Rotation Design

### 8.1 Zero-Downtime Rotation

```
1. POST /api/v1/api-keys/:id/rotate
   → New secret returned once
2. Client updates stored secret
3. Both old and new key are valid simultaneously
4. After grace period (max 24h), POST /api/v1/api-keys/:id/revoke (old key)
   OR new rotate automatically revokes previous secret
```

### 8.2 Rotation Rules

| Rule | Value |
|------|-------|
| Maximum grace period | 24 hours |
| Simultaneous validity | Yes — old key remains valid until revoked |
| Who can rotate | Any user with `settings:manage` permission who owns/has access to the key |
| New secret generated | Yes — each rotation produces a completely new secret |
| Version increment | Yes — `version` field increments on each rotation |
| Audit event | `api_key.rotate` with `metadata: { oldVersion, newVersion, actorUserId }` |
| Auto-revocation of previous | Yes — rotation updates the key record; the previous secret's hash is replaced. **Correction:** Rotation must NOT invalidate the old secret immediately; instead, rotation creates a new key record with `previousKeyId` linking to the old key. Both are valid during grace period.

**Correction to rotation model (2026-08-12 review):**
The original design proposed updating the existing row with a new hash, which would immediately invalidate the old secret. This is **not zero-downtime rotation**. The correct model is:

```
1. POST /api/v1/api-keys/:id/rotate
2. Create NEW api_key row with:
   - same tenantId, userId, name, scopes
   - new keyHash, keyPrefix, version += 1
   - previousKeyId = oldKey.id
   - expiresAt = oldKey.expiresAt
3. Mark old key: graceExpiresAt = now() + 24h
4. Return new secret to user
5. During grace period: validate against EITHER old key (if within grace) OR new key
6. After grace period: old key fully revoked
```

This preserves zero-downtime because clients can migrate gradually, and the old key continues working until the grace period expires.

### 8.3 Rotation Limits

| Limit | Value | Rationale |
|-------|-------|-----------|
| Max rotations per 24h | 5 | Prevent accidental loops |
| Min age before rotation | 0 | Allow immediate rotation if compromised |
| Grace period | 24h (hard max) | Balance security and operational practicality |

---

## 9. Revocation Design

### 9.1 Immediate Effectiveness

Revocation is **immediately effective** at the database level:

```sql
UPDATE api_keys SET revokedAt = NOW() WHERE id = $1;
```

Any subsequent `validateKey()` query includes `revokedAt IS NULL`, so the key is rejected on the next validation attempt.

### 9.2 Redis Cache Invalidation

If API-key validation results are cached in Redis (e.g., for performance), the cache must be invalidated on revocation.

**Strategy: Short TTL with explicit invalidation**

1. Cache successful validations with TTL = 60 seconds
2. On revocation: `DEL cache:api:<keyPrefix>`
3. On rotation: `DEL cache:api:<oldKeyPrefix>`
4. If Redis is unavailable for invalidation: the cache entry expires within 60s, providing bounded exposure

**No long-lived cache is permitted for API-key validation.**

### 9.3 Revocation Audit

- Audit event: `api_key.revoke`
- Metadata: `{ name, keyPrefix }`
- `userId` from JWT-authenticated actor
- `correlationId` from request

---

## 10. IP Allowlist Design

### 10.1 Recommendation: **Defer to Phase 2**

IP allowlisting adds significant operational complexity for a feature that may not be required for initial launch. The complexity includes:

- IPv4/IPv6 normalization and validation
- CIDR parsing and matching
- Proxy/load-balancer trusted IP configuration
- Testing across network topologies
- Customer support overhead (customers misconfiguring CIDRs)

**Phase 1 scope:** All IPs allowed if key is valid. Rate limiting provides the primary network-level control.

**Phase 2 scope:** Add `ipAllowlist` column, CIDR validation, and `ApiKeyIpGuard`.

### 10.2 If Added Later (Phase 2)

| Requirement | Approach |
|-------------|----------|
| IPv4 support | Native `net` module or `ipaddr.js` |
| IPv6 support | Same library |
| CIDR | `/24`, `/32`, `/64` formats |
| Input validation | Reject invalid CIDR at creation |
| Proxy behavior | Trust only configured `X-Forwarded-For` hops; never trust client-supplied header blindly |
| Default | `null` = allow all; empty array `[]` = deny all |

### 10.3 Trusted Proxy Configuration

```typescript
const TRUSTED_PROXIES = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];

function getClientIp(req: Request): string {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    const ips = (xForwardedFor as string).split(',');
    const clientIp = ips[0].trim();
    const lastHop = ips[ips.length - 1].trim();
    if (isIpInCidrs(lastHop, TRUSTED_PROXIES)) {
      return clientIp;
    }
  }
  return req.connection.remoteAddress ?? req.socket.remoteAddress ?? 'unknown';
}
```

**Never trust `X-Forwarded-For` without verifying the immediate peer is a trusted proxy.**

---

## 11. Audit Events

### 11.1 Required Events

| Event | Action | When | Metadata |
|-------|--------|------|----------|
| Key created | `api_key.create` | POST `/api/v1/api-keys` | `{ name, scopes, expiresAt, rateLimit }` |
| Key validated (failed) | `api_key.auth_failed` | Invalid Bearer token | `{ keyPrefix, reason }` |
| Key rotated | `api_key.rotate` | POST `/api/v1/api-keys/:id/rotate` | `{ oldKeyId, newKeyId, oldVersion, newVersion }` |
| Key revoked | `api_key.revoke` | DELETE `/api/v1/api-keys/:id` | `{ name }` |
| Scopes updated | `api_key.scopes_updated` | PATCH `/api/v1/api-keys/:id` | `{ oldScopes, newScopes }` |
| Rate limit updated | `api_key.rate_limit_updated` | PATCH `/api/v1/api-keys/:id` | `{ oldRateLimit, newRateLimit }` |

### 11.2 What NOT to Audit

- **Do not audit every successful API-key request.** This creates unbounded log growth and provides diminishing security value. Sample at most 1% of successful requests if usage analytics are needed.
- **Never log:** plaintext secrets, full Authorization headers, key hashes, patient data, or complete request bodies.

### 11.3 Correlation

All audit events include:
- `correlationId` from `CorrelationIdMiddleware`
- `userId` from JWT actor (management actions) or API-key owner (validation failures)
- `ipAddress` and `userAgent` from request

---

## 12. Tenant Isolation

### 12.1 Authoritative Tenant Source

The **API key's `tenantId`** is the sole authoritative tenant identity for API-key-authenticated requests.

**Prohibited sources for tenant identity:**
- Request body parameters (`tenantId`, `organisationId`, `practiceId`)
- Query parameters
- Path parameters (for resource access, not key validation)
- JWT claims (when authenticating via API key)
- Client-supplied headers

### 12.2 Tenant Propagation

```typescript
// ApiKeyAuthGuard sets request.user from the key record:
request.user = {
  id: apiKey.id,
  tenantId: apiKey.tenantId,
  userId: apiKey.userId,      // owner of the key
  scopes: apiKey.scopes,
  type: 'api-key',
};

// Downstream guards/services MUST use request.user.tenantId
// for all tenant-scoped queries.
```

### 12.3 Cross-Tenant Prevention

- All database queries in services filter by `tenantId` derived from `request.user.tenantId`
- `PermissionsGuard` (if applied after API key auth) queries permissions within the key's tenant
- No endpoint allows a API-key-authenticated user to access resources from a different tenant

---

## 13. API Key Limits

| Limit | Value | Rationale |
|-------|-------|-----------|
| Active keys per tenant | 50 | Prevent key sprawl; most SaaS limits are 10–100 |
| Active keys per user | 10 | Most users need 1–3 keys (dev, prod, integration) |
| Maximum scopes per key | 20 | Prevent overly broad keys |
| Maximum expiration | 5 years | Hard limit; encourages key rotation |
| Default expiration | None (null) | Keys valid until explicitly revoked |
| Minimum key name length | 1 char | Required |
| Maximum key name length | 255 chars | Matches database column |

---

## 14. Environment Separation

### 14.1 Environment Prefix in Secret

```
<env>:<version>:<random>
```

Examples:
- `dev:1:abc123...`
- `staging:1:def456...`
- `prod:1:ghi789...`

### 14.2 Environment Validation

API keys are **environment-scoped**. A `dev` key cannot authenticate against `prod` endpoints.

**Implementation:**
1. `env` field added to `ApiKey` model (enum: `DEV`, `STAGING`, `PROD`)
2. At key creation, environment is set from server configuration (not client-supplied)
3. `validateKey()` checks `apiKey.env === currentEnvironment`
4. Mismatch → reject with `403 Forbidden`

### 14.3 Management Endpoints

- API keys can only manage keys in the **same environment**
- `dev` environment keys cannot revoke `prod` keys
- Environment is derived from server config, never from request

### 14.4 Prisma Schema Addition

```prisma
model ApiKey {
  // ... existing fields ...
  env Environment @default(PROD)

  @@map("api_keys")
}

enum Environment {
  DEV
  STAGING
  PROD
}
```

---

## 15. Proposed Schema Changes

### 15.1 Migration: `add_api_key_security_fields`

```sql
-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "api_keys" ADD COLUMN     "env" "Environment" NOT NULL DEFAULT 'PROD';
ALTER TABLE "api_keys" ADD COLUMN     "rateLimit" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyPrefix_key" ON "api_keys"("keyPrefix");

-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('DEV', 'STAGING', 'PROD');
```

### 15.2 Updated Prisma Model

```prisma
enum Environment {
  DEV
  STAGING
  PROD
}

model ApiKey {
  id          String     @id @default(uuid()) @db.Uuid
  tenantId    String     @db.Uuid
  userId      String     @db.Uuid
  name        String     @db.VarChar(255)
  env         Environment @default(PROD)
  version     Int        @default(1)
  keyHash     String     @db.VarChar(255)
  keyPrefix   String     @db.VarChar(16) @unique
  scopes      Json
  rateLimit   Json?
  lastUsedAt  DateTime?  @db.Timestamptz()
  expiresAt   DateTime?  @db.Timestamptz()
  revokedAt   DateTime?  @db.Timestamptz()
  createdAt   DateTime   @default(now()) @db.Timestamptz()
  updatedAt   DateTime   @updatedAt @db.Timestamptz()

  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("api_keys")
  @@index([tenantId])
  @@index([keyPrefix])
}
```

**Index rationale:**
- `tenantId` — existing; used for listing keys
- `keyPrefix` — unique; used for validation lookup
- `keyHash` index removed — not queried directly
- `env` — not indexed; validation queries by `keyPrefix` which is unique

---

## 16. Service Design

### 16.1 `create()`

```typescript
async create(tenantId: string, userId: string, data: {
  name: string;
  scopes: string[];
  expiresAt?: Date;
  rateLimit?: { max: number; windowMs: number };
}): Promise<ApiKeyCreateResponse>
```

1. Validate requested scopes against creator's permissions
2. Generate `secret = `<env>:1:${crypto.randomBytes(32).toString('hex')}``
3. Compute `keyHash = await bcrypt.hash(secret, 12)`
4. Extract `keyPrefix = secret.slice(0, 16)`
5. Insert record with `tenantId`, `userId`, `env`, `keyHash`, `keyPrefix`, `version: 1`, `scopes`, `expiresAt`, `rateLimit`
6. Audit log: `api_key.create` with `metadata: { name, scopes, expiresAt, rateLimit }`
7. Return `{ id, name, keyPrefix, scopes, expiresAt, secret }` — **secret returned only once**

### 16.2 `validateKey()`

```typescript
async validateKey(secret: string, ip?: string): Promise<ApiKey | null>
```

1. Extract `env` and `keyPrefix` from secret
2. Verify `env === currentEnvironment` — reject mismatched environment
3. Query: `findUnique({ where: { keyPrefix } })` — O(1) with unique index
4. Validate:
   - `revokedAt === null`
   - `expiresAt === null || expiresAt > new Date()`
   - `tenantId` matches current tenant (defense in depth)
5. `bcrypt.compare(secret, keyHash)`
6. On success: update `lastUsedAt`, return key
7. On failure: return null

### 16.3 `rotate()`

Creates a new key record linked to the old one. Old key remains valid during grace period.

```typescript
async rotate(tenantId: string, id: string, userId: string): Promise<ApiKeyRotateResponse>
```

1. Find existing key by `id` + `tenantId`
2. Verify not already revoked
3. Generate new secret, hash, prefix
4. Create new row with `previousKeyId = oldKey.id`, `version += 1`
5. Set old key `graceExpiresAt = now() + 24h`
6. Audit log: `api_key.rotate`
7. Return new secret

### 16.4 `revoke()`

```typescript
async revoke(tenantId: string, id: string, userId: string): Promise<ApiKey>
```

1. Update `revokedAt = new Date()`
2. Clear any Redis cache for this key
3. Audit log: `api_key.revoke`
4. Return updated key

### 16.5 `findAll()`

```typescript
async findAll(tenantId: string): Promise<ApiKey[]>
```

- Query all keys for tenant
- Exclude `keyHash` from response
- Include `lastUsedAt`, `version`, `env`, `rateLimit` in response

---

## 17. Guards & Middleware

### 17.1 `ApiKeyAuthGuard`

- Extracts Bearer token
- Calls `validateKey(secret, ip)`
- Sets `request.user = { id, tenantId, userId, scopes, env, type: 'api-key' }`
- Throws `403` on invalid key

### 17.2 `ApiKeyScopesGuard`

- Reads required scopes from `@RequireApiScopes()` decorator
- Compares against `request.user.scopes`
- Supports wildcard expansion (only for platform-admin keys)
- Throws `403` on insufficient scopes

### 17.3 `ApiKeyRateLimitMiddleware`

- Runs after `ApiKeyAuthGuard`
- Reads `rateLimit` from `request.user` or fetches from DB
- Uses Redis sorted-set sliding window
- On Redis failure: throws `503 Service Unavailable`
- Sets `X-RateLimit-*` headers

### 17.4 Integration Order

```
Request
  ↓
CorrelationIdMiddleware
  ↓
SecurityHeadersMiddleware
  ↓
ThrottlerGuard (global, in-memory fallback)
  ↓
ApiKeyAuthGuard (if API key auth)
  ↓
ApiKeyScopesGuard (if scopes required)
  ↓
ApiKeyRateLimitMiddleware
  ↓
PermissionsGuard (if JWT auth)
  ↓
Controller
```

---

## 18. API Compatibility

### 18.1 Versioning

- Keys are versioned via `version` field and environment prefix
- Current version: `1`
- Version prefix in secret (`dev:1:`, `prod:1:`) allows future hash algorithm or format changes
- Backward-compatible: old version keys continue to work until explicitly revoked

### 18.2 Endpoint Paths

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/api-keys` | GET | JWT + `settings:manage` | List keys |
| `/api/v1/api-keys` | POST | JWT + `settings:manage` | Create key |
| `/api/v1/api-keys/:id` | PATCH | JWT + `settings:manage` | Update key |
| `/api/v1/api-keys/:id` | DELETE | JWT + `settings:manage` | Revoke key |
| `/api/v1/api-keys/:id/rotate` | POST | JWT + `settings:manage` | Rotate key |

**Management endpoints require JWT auth** — API keys cannot manage other API keys.

### 18.3 Client Usage

```
GET /api/v1/patients
Authorization: Bearer prod:1:abc123...
```

---

## 19. Implementation Plan

### Phase 1: Schema & Migration
1. Create migration `add_api_key_security_fields`
2. Add `version`, `env`, `rateLimit` columns
3. Add `Environment` enum
4. Add `keyPrefix` unique constraint
5. Remove `keyHash` index

### Phase 2: Service Refactor
1. Update `ApiKeysService`:
   - New secret format (`<env>:1:<64-hex>`)
   - `validateKey()` — single-row lookup, environment check
   - `rotate()` — create new record with `previousKeyId`
   - Scope validation against creator permissions
   - Update `lastUsedAt` on validation
2. Add `rateLimit` metadata handling

### Phase 3: Guards & Middleware
1. Update `ApiKeyAuthGuard`:
   - Environment validation
   - Pass `ip` to validation
2. Create `ApiKeyScopesGuard`:
   - `@RequireApiScopes()` decorator
   - Wildcard scope matching (platform admin only)
3. Create `ApiKeyRateLimitMiddleware`:
   - Redis sorted-set sliding window
   - Fail-closed on Redis failure

### Phase 4: Controller Updates
1. Add `PATCH /api/v1/api-keys/:id` — update scopes, rateLimit
2. Add `POST /api/v1/api-keys/:id/rotate` — rotation endpoint
3. Remove duplicate audit logging (service only)
4. Add `DELETE /api/v1/api-keys/:id` — revoke endpoint

### Phase 5: Tests
1. Unit tests for service methods
2. Guard tests for scope and environment enforcement
3. Rate limit middleware tests (including Redis failure)
4. Integration tests for rotation workflow
5. Tenant isolation tests

### Phase 6: Documentation
1. API docs in Swagger
2. Developer guide for API key usage
3. Migration guide for existing keys

### Phase 7: IP Allowlist (Future)
- Add `ipAllowlist` column
- CIDR validation and matching
- Trusted proxy configuration

---

## 20. Open Questions

1. **Key prefix length:** 16 chars chosen; sufficient entropy confirmed
2. **Bcrypt cost factor:** 12 selected; should be measured under production load
3. **Rate limit defaults:** Per-tenant default 1,000/60s; per-key default 100/60s
4. **Scope wildcards:** `resource:*` allowed only for platform-admin-created keys
5. **Environment enum:** `DEV`, `STAGING`, `PROD` — sufficient?
6. **Rotation grace period:** 24h hard maximum

---

## 21. Out of Scope

- API key usage analytics dashboard
- Key usage quota (beyond rate limiting)
- Key sharing detection
- Hardware key support (YubiKey, etc.)
- OAuth2 client credentials flow
- Webhook signature authentication (separate concern)
- IP allowlist (deferred to Phase 7)

---

# Architecture Decision

## Decisions

| # | Decision | Status |
|---|----------|--------|
| 1 | **Authentication model:** Bearer token with `<env>:<version>:<random>` secret format; bcrypt hashes stored in DB | APPROVED FOR IMPLEMENTATION |
| 2 | **Authorization model:** Three-layer evaluation: (1) creator's Danta permission, (2) API-key scope, (3) tenant/resource authorization. Scopes are a subset of creator's permissions, not an independent system. | APPROVED FOR IMPLEMENTATION |
| 3 | **Scope model:** `resource:action` format. `write` = `create` + `update`. Wildcard (`resource:*`) prohibited for regular keys, allowed only for platform-admin-created service keys. `*:*` never allowed. | APPROVED FOR IMPLEMENTATION |
| 4 | **Key storage model:** Plaintext never stored. Bcrypt cost factor 12 for hash storage. Unique 16-char hex prefix for O(1) lookup. Environment prefix in secret for environment isolation. | APPROVED FOR IMPLEMENTATION |
| 5 | **Rate limiting model:** Redis sorted-set sliding window. Fail **closed** (503) when Redis unavailable. Emergency fallback: NestJS ThrottlerGuard (in-memory, per-instance). Per-tenant default 1,000/60s, per-key default 100/60s. | APPROVED FOR IMPLEMENTATION |
| 6 | **Rotation model:** Zero-downtime via new key record with `previousKeyId`. Old key valid during 24h grace period. Max 5 rotations per 24h. | APPROVED FOR IMPLEMENTATION |
| 7 | **Revocation model:** Immediate database-level effectiveness. Redis cache TTL ≤ 60s with explicit invalidation on revocation. | APPROVED FOR IMPLEMENTATION |
| 8 | **Expiration model:** Optional `expiresAt` per key. No default expiration. Max 5 years. | APPROVED FOR IMPLEMENTATION |
| 9 | **Tenant isolation model:** Tenant derived exclusively from API key record. Request body/query/path parameters cannot override tenant identity. | APPROVED FOR IMPLEMENTATION |
| 10 | **Audit model:** 6 event types: `api_key.create`, `api_key.auth_failed`, `api_key.rotate`, `api_key.revoke`, `api_key.scopes_updated`, `api_key.rate_limit_updated`. Never log secrets. | APPROVED FOR IMPLEMENTATION |
| 11 | **IP restriction model:** Deferred to Phase 2. Not implemented in initial release. | REQUIRES DECISION |
| 12 | **Redis failure behavior:** Fail closed for API-key rate limiting. 503 response when Redis is unavailable for rate-limit checks. | APPROVED FOR IMPLEMENTATION |

## Pending Decisions

| # | Decision | Status |
|---|----------|--------|
| 1 | **Bcrypt cost factor:** 12 selected; must be measured under production load. Consider reducing to 10 or 8 if validation latency exceeds SLA. | REQUIRES DECISION |
| 2 | **Rate limit defaults:** Per-tenant 1,000/60s and per-key 100/60s selected; must be validated against expected usage patterns. | REQUIRES DECISION |
| 3 | **Environment enum:** `DEV`, `STAGING`, `PROD` selected; confirm with deployment team. | REQUIRES DECISION |

