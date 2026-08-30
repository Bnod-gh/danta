-- CreateEnum
CREATE TYPE "PatientRelationshipType" AS ENUM ('parent', 'child', 'spouse', 'sibling', 'guardian', 'ward', 'other');

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "billingAddress" JSONB,
ADD COLUMN     "billingEmail" VARCHAR(255),
ADD COLUMN     "billingName" VARCHAR(200),
ADD COLUMN     "billingTaxId" VARCHAR(50),
ADD COLUMN     "doNotContact" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nationalId" VARCHAR(50),
ADD COLUMN     "nationalIdType" VARCHAR(20),
ADD COLUMN     "notes" VARCHAR(2000),
ADD COLUMN     "photoUrl" VARCHAR(500),
ADD COLUMN     "preferredLanguage" VARCHAR(10),
ADD COLUMN     "profession" VARCHAR(100),
ADD COLUMN     "workplace" VARCHAR(200);

-- CreateTable
CREATE TABLE "patient_legal_guardians" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "relationship" VARCHAR(50) NOT NULL,
    "nationalId" VARCHAR(20),
    "phone" VARCHAR(32),
    "email" VARCHAR(255),
    "address" VARCHAR(200),
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "patient_legal_guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_relationships" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "relatedPatientId" UUID NOT NULL,
    "type" "PatientRelationshipType" NOT NULL DEFAULT 'other',
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "patient_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_legal_guardians_patientId_key" ON "patient_legal_guardians"("patientId");

-- CreateIndex
CREATE INDEX "patient_legal_guardians_tenantId_idx" ON "patient_legal_guardians"("tenantId");

-- CreateIndex
CREATE INDEX "patient_relationships_tenantId_relatedPatientId_idx" ON "patient_relationships"("tenantId", "relatedPatientId");

-- CreateIndex
CREATE UNIQUE INDEX "unique_tenant_relationship_pair" ON "patient_relationships"("tenantId", "patientId", "relatedPatientId");

-- AddForeignKey
ALTER TABLE "patient_legal_guardians" ADD CONSTRAINT "patient_legal_guardians_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_relationships" ADD CONSTRAINT "patient_relationships_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_relationships" ADD CONSTRAINT "patient_relationships_relatedPatientId_fkey" FOREIGN KEY ("relatedPatientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
