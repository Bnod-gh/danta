-- CreateEnum
CREATE TYPE "InsuranceClaimStatus" AS ENUM ('draft', 'submitted', 'in_review', 'paid', 'partially_paid', 'denied', 'cancelled');

-- AlterTable
ALTER TABLE "invoice_items" ADD COLUMN     "cdtCode" VARCHAR(16),
ADD COLUMN     "copay" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "insuranceCovered" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "insuranceAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "patientAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "insurance_claims" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "invoiceId" UUID,
    "patientId" UUID NOT NULL,
    "integrationId" UUID,
    "claimNumber" VARCHAR(32) NOT NULL,
    "externalClaimId" VARCHAR(64),
    "status" "InsuranceClaimStatus" NOT NULL DEFAULT 'draft',
    "amount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2),
    "submittedAt" TIMESTAMPTZ,
    "processedAt" TIMESTAMPTZ,
    "rejectionReason" VARCHAR(500),
    "providerReference" VARCHAR(128),
    "notes" VARCHAR(1000),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "insurance_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_claim_history" (
    "id" UUID NOT NULL,
    "claimId" UUID NOT NULL,
    "status" "InsuranceClaimStatus" NOT NULL,
    "note" VARCHAR(500),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insurance_claim_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procedure_codes" (
    "id" UUID NOT NULL,
    "code" VARCHAR(16) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "defaultFee" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "procedure_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insurance_claims_claimNumber_key" ON "insurance_claims"("claimNumber");

-- CreateIndex
CREATE INDEX "insurance_claims_tenantId_status_idx" ON "insurance_claims"("tenantId", "status");

-- CreateIndex
CREATE INDEX "insurance_claims_tenantId_patientId_idx" ON "insurance_claims"("tenantId", "patientId");

-- CreateIndex
CREATE INDEX "insurance_claims_invoiceId_idx" ON "insurance_claims"("invoiceId");

-- CreateIndex
CREATE INDEX "insurance_claim_history_claimId_createdAt_idx" ON "insurance_claim_history"("claimId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "procedure_codes_code_key" ON "procedure_codes"("code");

-- CreateIndex
CREATE INDEX "procedure_codes_category_idx" ON "procedure_codes"("category");

-- AddForeignKey
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "claim_integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_claim_history" ADD CONSTRAINT "insurance_claim_history_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "insurance_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
