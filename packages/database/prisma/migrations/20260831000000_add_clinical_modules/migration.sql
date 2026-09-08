-- CreateTable ClinicalModule
CREATE TABLE "clinical_modules" (
    "id" UUID NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "clinical_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable SchedulingResource
CREATE TABLE "scheduling_resources" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "scheduling_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable SchedulingResourceModule
CREATE TABLE "scheduling_resource_modules" (
    "id" UUID NOT NULL,
    "schedulingResourceId" UUID NOT NULL,
    "clinicalModuleId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "scheduling_resource_modules_pkey" PRIMARY KEY ("id")
);

-- Add fields to ToothCondition
ALTER TABLE "tooth_conditions" ADD COLUMN "clinicalModule" VARCHAR(100);
ALTER TABLE "tooth_conditions" ADD COLUMN "clinicalStatus" VARCHAR(50);
ALTER TABLE "tooth_conditions" ADD COLUMN "diagnosis" TEXT;
ALTER TABLE "tooth_conditions" ADD COLUMN "treatmentPlan" TEXT;
ALTER TABLE "tooth_conditions" ADD COLUMN "inProgress" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tooth_conditions" ADD COLUMN "completedAt" TIMESTAMPTZ(6);

-- CreateIndex for ClinicalModule
CREATE UNIQUE INDEX "clinical_modules_type_key" ON "clinical_modules"("type");
CREATE INDEX "clinical_modules_category_idx" ON "clinical_modules"("category");

-- CreateIndex for SchedulingResource
CREATE UNIQUE INDEX "scheduling_resources_tenantId_type_key" ON "scheduling_resources"("tenantId", "type");
CREATE INDEX "scheduling_resources_tenantId_active_idx" ON "scheduling_resources"("tenantId", "active");

-- CreateIndex for SchedulingResourceModule
CREATE UNIQUE INDEX "scheduling_resource_modules_schedulingResourceId_clinicalModuleId_key" ON "scheduling_resource_modules"("schedulingResourceId", "clinicalModuleId");
CREATE INDEX "scheduling_resource_modules_schedulingResourceId_idx" ON "scheduling_resource_modules"("schedulingResourceId");
CREATE INDEX "scheduling_resource_modules_clinicalModuleId_idx" ON "scheduling_resource_modules"("clinicalModuleId");

-- CreateIndex for ToothCondition clinical fields
CREATE INDEX "tooth_conditions_clinicalModule_idx" ON "tooth_conditions"("tenantId", "clinicalModule");

-- AddForeignKey for SchedulingResourceModule
ALTER TABLE "scheduling_resource_modules" ADD CONSTRAINT "scheduling_resource_modules_schedulingResourceId_fkey" FOREIGN KEY ("schedulingResourceId") REFERENCES "scheduling_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scheduling_resource_modules" ADD CONSTRAINT "scheduling_resource_modules_clinicalModuleId_fkey" FOREIGN KEY ("clinicalModuleId") REFERENCES "clinical_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
