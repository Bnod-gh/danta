/*
  Warnings:

  - You are about to drop the `availability` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ScheduleOverrideType" AS ENUM ('time_off', 'custom_hours');

-- DropForeignKey
ALTER TABLE "availability" DROP CONSTRAINT "availability_providerId_fkey";

-- DropTable
DROP TABLE "availability";

-- CreateTable
CREATE TABLE "provider_shifts" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" VARCHAR(8) NOT NULL,
    "endTime" VARCHAR(8) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "provider_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_overrides" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "date" TIMESTAMPTZ NOT NULL,
    "type" "ScheduleOverrideType" NOT NULL DEFAULT 'time_off',
    "isFullDay" BOOLEAN NOT NULL DEFAULT true,
    "startTime" VARCHAR(8),
    "endTime" VARCHAR(8),
    "reason" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "schedule_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "provider_shifts_tenantId_providerId_idx" ON "provider_shifts"("tenantId", "providerId");

-- CreateIndex
CREATE INDEX "schedule_overrides_tenantId_providerId_idx" ON "schedule_overrides"("tenantId", "providerId");

-- CreateIndex
CREATE INDEX "schedule_overrides_tenantId_date_idx" ON "schedule_overrides"("tenantId", "date");

-- AddForeignKey
ALTER TABLE "provider_shifts" ADD CONSTRAINT "provider_shifts_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_overrides" ADD CONSTRAINT "schedule_overrides_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rename calendar permissions to schedule (RolePermission links stay valid)
UPDATE "permissions" SET "resource" = 'schedule' WHERE "resource" = 'calendar';
