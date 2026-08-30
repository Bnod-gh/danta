-- CreateEnum
CREATE TYPE "CreditNoteStatus" AS ENUM ('applied', 'voided');

-- DropIndex
DROP INDEX "unique_payment_invoice";

-- AlterTable (creditNoteNumber added nullable first, backfilled below, then enforced)
ALTER TABLE "credit_notes" ADD COLUMN "creditNoteNumber" VARCHAR(32);
ALTER TABLE "credit_notes" ADD COLUMN "outstanding" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "credit_notes" ADD COLUMN "status" "CreditNoteStatus" NOT NULL DEFAULT 'applied';

-- Backfill credit note numbers and outstanding amounts for existing rows
UPDATE "credit_notes"
SET "creditNoteNumber" = 'CN-' || UPPER(SUBSTRING(MD5("id"::text), 1, 8))
WHERE "creditNoteNumber" IS NULL;
UPDATE "credit_notes" SET "outstanding" = "amount";
ALTER TABLE "credit_notes" ALTER COLUMN "creditNoteNumber" SET NOT NULL;

-- CreateIndex
CREATE INDEX "credit_notes_tenantId_status_idx" ON "credit_notes"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "credit_notes_tenantId_creditNoteNumber_key" ON "credit_notes"("tenantId", "creditNoteNumber");