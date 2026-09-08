-- CreateTable ToothConditionConfig
CREATE TABLE "tooth_condition_configs" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(50) NOT NULL DEFAULT 'general',
    "color" VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
    "surfaces" TEXT[] NOT NULL DEFAULT '{}',
    "cdtCode" VARCHAR(20),
    "cdtDescription" VARCHAR(255),
    "cdtFee" DECIMAL(10, 2),
    "icon" VARCHAR(50),
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tooth_condition_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tooth_condition_configs_tenantId_code_key" ON "tooth_condition_configs"("tenantId", "code");
CREATE INDEX "tooth_condition_configs_tenantId_active_idx" ON "tooth_condition_configs"("tenantId", "active");
CREATE INDEX "tooth_condition_configs_tenantId_category_idx" ON "tooth_condition_configs"("tenantId", "category");
