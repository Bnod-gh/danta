-- Make audit_logs.tenantId nullable so failed-login audit records
-- (where no tenant context exists) can be persisted.

ALTER TABLE "audit_logs" ALTER COLUMN "tenantId" DROP NOT NULL;