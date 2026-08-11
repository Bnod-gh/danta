-- CreateTable
CREATE TABLE "claim_integrations" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "credentialReference" VARCHAR(255),
    "healthStatus" VARCHAR(50),
    "lastSuccessfulOp" TIMESTAMPTZ,
    "lastError" VARCHAR(1000),
    "errorStatus" VARCHAR(50),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "claim_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "claim_integrations_tenantId_idx" ON "claim_integrations"("tenantId");

-- CreateIndex
CREATE INDEX "claim_integrations_tenantId_provider_idx" ON "claim_integrations"("tenantId", "provider");
