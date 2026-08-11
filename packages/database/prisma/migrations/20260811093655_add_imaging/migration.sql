-- CreateTable
CREATE TABLE "imaging_studies" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "appointmentId" UUID,
    "studyDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modality" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500),
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "storageProvider" VARCHAR(50) NOT NULL DEFAULT 'local',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "imaging_studies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imaging_images" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "imagingStudyId" UUID NOT NULL,
    "toothNumber" INTEGER,
    "imageType" VARCHAR(50) NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" VARCHAR(500) NOT NULL,
    "url" VARCHAR(1000),
    "metadata" JSONB,
    "uploadedBy" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "imaging_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imaging_integrations" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "imaging_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "imaging_studies_tenantId_patientId_idx" ON "imaging_studies"("tenantId", "patientId");

-- CreateIndex
CREATE INDEX "imaging_studies_tenantId_studyDate_idx" ON "imaging_studies"("tenantId", "studyDate");

-- CreateIndex
CREATE INDEX "imaging_images_tenantId_imagingStudyId_idx" ON "imaging_images"("tenantId", "imagingStudyId");

-- CreateIndex
CREATE INDEX "imaging_integrations_tenantId_idx" ON "imaging_integrations"("tenantId");

-- AddForeignKey
ALTER TABLE "imaging_studies" ADD CONSTRAINT "imaging_studies_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imaging_studies" ADD CONSTRAINT "imaging_studies_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imaging_images" ADD CONSTRAINT "imaging_images_imagingStudyId_fkey" FOREIGN KEY ("imagingStudyId") REFERENCES "imaging_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
