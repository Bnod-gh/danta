-- CreateTable
CREATE TABLE "patient_forms" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "data" JSONB,
    "submittedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "patient_forms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_forms_tenantId_patientId_idx" ON "patient_forms"("tenantId", "patientId");

-- AddForeignKey
ALTER TABLE "patient_forms" ADD CONSTRAINT "patient_forms_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
