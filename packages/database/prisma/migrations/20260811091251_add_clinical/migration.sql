-- CreateEnum
CREATE TYPE "ClinicalNoteType" AS ENUM ('general', 'examination', 'procedure', 'referral');

-- CreateEnum
CREATE TYPE "TreatmentPlanStatus" AS ENUM ('draft', 'proposed', 'approved', 'in_progress', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "clinical_notes" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "appointmentId" UUID,
    "providerId" UUID NOT NULL,
    "note" VARCHAR(5000) NOT NULL,
    "type" "ClinicalNoteType" NOT NULL DEFAULT 'general',
    "signedAt" TIMESTAMPTZ,
    "signedBy" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "clinical_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "content" VARCHAR(5000) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dental_charts" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "chartDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" VARCHAR(1000),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "dental_charts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tooth_conditions" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "dentalChartId" UUID NOT NULL,
    "toothNumber" INTEGER NOT NULL,
    "condition" VARCHAR(255) NOT NULL,
    "surface" VARCHAR(50),
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tooth_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_history" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "appointmentId" UUID,
    "providerId" UUID NOT NULL,
    "treatment" VARCHAR(255) NOT NULL,
    "description" VARCHAR(1000),
    "cost" DOUBLE PRECISION,
    "date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(50) NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "treatment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_plans" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" "TreatmentPlanStatus" NOT NULL DEFAULT 'draft',
    "notes" VARCHAR(1000),
    "approvedAt" TIMESTAMPTZ,
    "approvedBy" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "treatment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodontal_records" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "chartDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "toothNumber" INTEGER NOT NULL,
    "pocketDepth" INTEGER,
    "recession" INTEGER,
    "bleeding" BOOLEAN DEFAULT false,
    "plaque" BOOLEAN DEFAULT false,
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "periodontal_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clinical_notes_tenantId_patientId_idx" ON "clinical_notes"("tenantId", "patientId");

-- CreateIndex
CREATE INDEX "clinical_notes_tenantId_appointmentId_idx" ON "clinical_notes"("tenantId", "appointmentId");

-- CreateIndex
CREATE INDEX "templates_tenantId_idx" ON "templates"("tenantId");

-- CreateIndex
CREATE INDEX "dental_charts_tenantId_patientId_idx" ON "dental_charts"("tenantId", "patientId");

-- CreateIndex
CREATE INDEX "tooth_conditions_tenantId_dentalChartId_idx" ON "tooth_conditions"("tenantId", "dentalChartId");

-- CreateIndex
CREATE INDEX "treatment_history_tenantId_patientId_idx" ON "treatment_history"("tenantId", "patientId");

-- CreateIndex
CREATE INDEX "treatment_history_tenantId_appointmentId_idx" ON "treatment_history"("tenantId", "appointmentId");

-- CreateIndex
CREATE INDEX "treatment_plans_tenantId_patientId_idx" ON "treatment_plans"("tenantId", "patientId");

-- CreateIndex
CREATE INDEX "periodontal_records_tenantId_patientId_idx" ON "periodontal_records"("tenantId", "patientId");

-- AddForeignKey
ALTER TABLE "tooth_conditions" ADD CONSTRAINT "tooth_conditions_dentalChartId_fkey" FOREIGN KEY ("dentalChartId") REFERENCES "dental_charts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
