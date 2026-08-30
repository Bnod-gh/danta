-- CreateEnum
CREATE TYPE "StatementStatus" AS ENUM ('draft', 'sent');

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('waiting', 'booked', 'cancelled');

-- AlterEnum
ALTER TYPE "TreatmentPlanStatus" ADD VALUE 'rejected';

-- CreateTable
CREATE TABLE "statements" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "fromDate" TIMESTAMPTZ NOT NULL,
    "toDate" TIMESTAMPTZ NOT NULL,
    "openingBalance" DECIMAL(12,2) NOT NULL,
    "closingBalance" DECIMAL(12,2) NOT NULL,
    "status" "StatementStatus" NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMPTZ,
    "sentBy" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "providerId" UUID,
    "chairId" UUID,
    "appointmentTypeId" UUID,
    "preferredStartTime" TIMESTAMPTZ NOT NULL,
    "preferredEndTime" TIMESTAMPTZ NOT NULL,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'waiting',
    "notes" VARCHAR(1000),
    "bookedAppointmentId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "statements_tenantId_patientId_idx" ON "statements"("tenantId", "patientId");

-- CreateIndex
CREATE INDEX "statements_tenantId_status_idx" ON "statements"("tenantId", "status");

-- CreateIndex
CREATE INDEX "waitlist_tenantId_patientId_idx" ON "waitlist"("tenantId", "patientId");

-- CreateIndex
CREATE INDEX "waitlist_tenantId_status_idx" ON "waitlist"("tenantId", "status");

-- CreateIndex
CREATE INDEX "waitlist_tenantId_preferredStartTime_idx" ON "waitlist"("tenantId", "preferredStartTime");
