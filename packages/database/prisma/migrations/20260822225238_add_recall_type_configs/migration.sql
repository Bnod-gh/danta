-- CreateEnum
CREATE TYPE "RecallChannel" AS ENUM ('sms', 'email', 'both');

-- CreateTable
CREATE TABLE "recall_type_configs" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "type" "RecallType" NOT NULL,
    "intervalDays" INTEGER NOT NULL DEFAULT 180,
    "channel" "RecallChannel" NOT NULL DEFAULT 'sms',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "recall_type_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recall_type_configs_tenantId_type_key" ON "recall_type_configs"("tenantId", "type");
