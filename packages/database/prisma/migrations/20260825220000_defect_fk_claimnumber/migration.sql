-- Defect §4.15: InsuranceClaim.claimNumber should be tenant-scoped, not globally unique.
-- Remove the global unique constraint.
DROP INDEX IF EXISTS "insurance_claims_claimNumber_key" CASCADE;

-- Add a tenant-scoped unique constraint.
CREATE UNIQUE INDEX "unique_tenant_claim_number" ON "insurance_claims"("tenantId", "claimNumber");

-- Defect §4.14: Refund.paymentId lacked a foreign-key relation in the schema.
-- The column already exists; this adds the FK for referential integrity.
ALTER TABLE "refunds"
  ADD CONSTRAINT "refunds_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "payments" ("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

-- Index to support the FK
CREATE INDEX IF NOT EXISTS "refunds_paymentId_idx" ON "refunds"("paymentId");

-- Phase 5: Add taxMode column to TenantSetting for GST-inclusive/exclusive mode.
-- No schema column change needed — tenantSetting.value is JSONB and taxMode
-- is stored as part of the billing settings JSON blob. The BillingSettingsSchema
-- in @danta/schemas now includes the taxMode field.
