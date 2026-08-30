-- DropIndex
DROP INDEX "patient_medical_history_tenantId_patientId_idx";

-- AlterTable
ALTER TABLE "patient_contacts" ADD COLUMN     "isLegalGuardian" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "patient_medical_history" ADD COLUMN     "isControlled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isCritical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "medications" VARCHAR(500);

-- CreateTable
CREATE TABLE "patient_medical_context" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "isPregnant" BOOLEAN NOT NULL DEFAULT false,
    "pregnancyWeek" INTEGER,
    "isLactating" BOOLEAN NOT NULL DEFAULT false,
    "isOnAnticoagulants" BOOLEAN NOT NULL DEFAULT false,
    "anticoagulantMedication" VARCHAR(255),
    "inrValue" DECIMAL(4,2),
    "lastInrDate" TIMESTAMPTZ,
    "isSmoker" BOOLEAN NOT NULL DEFAULT false,
    "smokingFrequency" VARCHAR(100),
    "alcoholConsumption" VARCHAR(100),
    "bruxism" BOOLEAN NOT NULL DEFAULT false,
    "adverseAnesthesiaReaction" BOOLEAN NOT NULL DEFAULT false,
    "anesthesiaReactionDetails" VARCHAR(500),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "patient_medical_context_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_surgical_history" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "procedure" VARCHAR(255) NOT NULL,
    "surgeryDate" TIMESTAMPTZ,
    "complications" VARCHAR(500),
    "notes" VARCHAR(1000),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "patient_surgical_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_medical_context_patientId_key" ON "patient_medical_context"("patientId");

-- CreateIndex
CREATE INDEX "patient_medical_context_tenantId_idx" ON "patient_medical_context"("tenantId");

-- CreateIndex
CREATE INDEX "patient_surgical_history_tenantId_patientId_idx" ON "patient_surgical_history"("tenantId", "patientId");

-- AddForeignKey
ALTER TABLE "patient_medical_context" ADD CONSTRAINT "patient_medical_context_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_surgical_history" ADD CONSTRAINT "patient_surgical_history_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
