-- CreateEnum
CREATE TYPE "FindingSeverity" AS ENUM ('mild', 'moderate', 'severe');

-- CreateEnum
CREATE TYPE "TreatmentPlanItemStatus" AS ENUM ('planned', 'accepted', 'declined', 'scheduled', 'in_progress', 'completed', 'partially_completed', 'cancelled');

-- CreateEnum
CREATE TYPE "PlanItemPriority" AS ENUM ('low', 'routine', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "EstimateStatus" AS ENUM ('draft', 'presented', 'approved', 'partially_approved', 'rejected', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('approved', 'rejected', 'partially_approved');

-- CreateEnum
CREATE TYPE "SignatureMethod" AS ENUM ('in_person', 'written', 'electronic', 'verbal');

-- AlterTable
ALTER TABLE "tooth_conditions" ADD COLUMN     "createdByUserId" UUID,
ADD COLUMN     "providerId" UUID,
ADD COLUMN     "removedAt" TIMESTAMPTZ,
ADD COLUMN     "resolvedAt" TIMESTAMPTZ,
ADD COLUMN     "resolvedByUserId" UUID,
ADD COLUMN     "severity" "FindingSeverity",
ADD COLUMN     "supersedesId" UUID,
ADD COLUMN     "surfaces" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "treatment_plans" ADD COLUMN     "supersedesId" UUID,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "treatment_plan_items" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "serviceId" UUID,
    "providerId" UUID,
    "appointmentId" UUID,
    "treatmentCode" VARCHAR(16),
    "description" VARCHAR(255) NOT NULL,
    "toothNumber" VARCHAR(10),
    "surfaces" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "estimatedMinutes" INTEGER,
    "priority" "PlanItemPriority" NOT NULL DEFAULT 'routine',
    "status" "TreatmentPlanItemStatus" NOT NULL DEFAULT 'planned',
    "notes" VARCHAR(500),
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "treatment_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_treatments" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "planItemId" UUID NOT NULL,
    "performed" BOOLEAN NOT NULL DEFAULT false,
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_treatments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estimate" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "providerId" UUID,
    "treatmentPlanId" UUID,
    "createdByUserId" UUID NOT NULL,
    "supersedesId" UUID,
    "estimateNumber" VARCHAR(32) NOT NULL,
    "status" "EstimateStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "validUntil" TIMESTAMPTZ,
    "presentedAt" TIMESTAMPTZ,
    "approvedAt" TIMESTAMPTZ,
    "rejectedAt" TIMESTAMPTZ,
    "cancelledAt" TIMESTAMPTZ,
    "notes" VARCHAR(1000),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Estimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimate_items" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "estimateId" UUID NOT NULL,
    "planItemId" UUID,
    "cdtCode" VARCHAR(16),
    "description" VARCHAR(255) NOT NULL,
    "toothNumber" VARCHAR(10),
    "surfaces" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estimate_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimate_approvals" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "estimateId" UUID NOT NULL,
    "decision" "ApprovalDecision" NOT NULL,
    "signerName" VARCHAR(255) NOT NULL,
    "method" "SignatureMethod" NOT NULL,
    "approvedByUserId" UUID,
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(255),
    "metadata" JSONB,
    "signedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estimate_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "treatment_plan_items_tenantId_planId_idx" ON "treatment_plan_items"("tenantId", "planId");

-- CreateIndex
CREATE INDEX "treatment_plan_items_tenantId_status_idx" ON "treatment_plan_items"("tenantId", "status");

-- CreateIndex
CREATE INDEX "treatment_plan_items_tenantId_toothNumber_idx" ON "treatment_plan_items"("tenantId", "toothNumber");

-- CreateIndex
CREATE INDEX "appointment_treatments_tenantId_planItemId_idx" ON "appointment_treatments"("tenantId", "planItemId");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_treatments_tenantId_appointmentId_planItemId_key" ON "appointment_treatments"("tenantId", "appointmentId", "planItemId");

-- CreateIndex
CREATE INDEX "Estimate_tenantId_patientId_idx" ON "Estimate"("tenantId", "patientId");

-- CreateIndex
CREATE INDEX "Estimate_tenantId_status_idx" ON "Estimate"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Estimate_tenantId_estimateNumber_key" ON "Estimate"("tenantId", "estimateNumber");

-- CreateIndex
CREATE INDEX "estimate_items_tenantId_estimateId_idx" ON "estimate_items"("tenantId", "estimateId");

-- CreateIndex
CREATE INDEX "estimate_approvals_tenantId_estimateId_idx" ON "estimate_approvals"("tenantId", "estimateId");

-- CreateIndex
CREATE INDEX "tooth_conditions_tenantId_toothNumber_idx" ON "tooth_conditions"("tenantId", "toothNumber");

-- CreateIndex
CREATE INDEX "tooth_conditions_tenantId_status_idx" ON "tooth_conditions"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "tooth_conditions" ADD CONSTRAINT "tooth_conditions_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tooth_conditions" ADD CONSTRAINT "tooth_conditions_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tooth_conditions" ADD CONSTRAINT "tooth_conditions_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tooth_conditions" ADD CONSTRAINT "tooth_conditions_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "tooth_conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_plan_items" ADD CONSTRAINT "treatment_plan_items_planId_fkey" FOREIGN KEY ("planId") REFERENCES "treatment_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_plan_items" ADD CONSTRAINT "treatment_plan_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_plan_items" ADD CONSTRAINT "treatment_plan_items_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_plan_items" ADD CONSTRAINT "treatment_plan_items_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_treatments" ADD CONSTRAINT "appointment_treatments_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_treatments" ADD CONSTRAINT "appointment_treatments_planItemId_fkey" FOREIGN KEY ("planItemId") REFERENCES "treatment_plan_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_treatmentPlanId_fkey" FOREIGN KEY ("treatmentPlanId") REFERENCES "treatment_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "Estimate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_items" ADD CONSTRAINT "estimate_items_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_items" ADD CONSTRAINT "estimate_items_planItemId_fkey" FOREIGN KEY ("planItemId") REFERENCES "treatment_plan_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_approvals" ADD CONSTRAINT "estimate_approvals_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_approvals" ADD CONSTRAINT "estimate_approvals_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "treatment_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
