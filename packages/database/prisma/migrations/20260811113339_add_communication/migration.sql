-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('sms', 'email', 'in_app', 'patient_portal');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('pending', 'sent', 'delivered', 'failed', 'read');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('appointment', 'recall', 'billing', 'clinical', 'system');

-- CreateEnum
CREATE TYPE "RecallType" AS ENUM ('examination', 'hygiene', 'periodontal', 'xray', 'treatment_followup', 'custom');

-- CreateEnum
CREATE TYPE "RecallStatus" AS ENUM ('due', 'overdue', 'booked', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('scheduled', 'sent', 'delivered', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "communication_templates" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "subject" VARCHAR(255),
    "body" VARCHAR(5000) NOT NULL,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "communication_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_preferences" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "patientPortalEnabled" BOOLEAN NOT NULL DEFAULT true,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "reminderChannel" "MessageChannel" NOT NULL DEFAULT 'sms',
    "reminderLeadTime" INTEGER NOT NULL DEFAULT 24,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "communication_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID,
    "userId" UUID,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" VARCHAR(1000) NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID,
    "channel" "MessageChannel" NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'pending',
    "subject" VARCHAR(255),
    "body" VARCHAR(5000) NOT NULL,
    "recipient" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(100),
    "externalId" VARCHAR(255),
    "error" VARCHAR(1000),
    "sentAt" TIMESTAMPTZ,
    "deliveredAt" TIMESTAMPTZ,
    "readAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recalls" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "type" "RecallType" NOT NULL,
    "status" "RecallStatus" NOT NULL DEFAULT 'due',
    "dueDate" TIMESTAMPTZ NOT NULL,
    "notes" VARCHAR(1000),
    "contactCount" INTEGER NOT NULL DEFAULT 0,
    "lastContactAt" TIMESTAMPTZ,
    "bookedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "recalls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_reminders" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'scheduled',
    "scheduledAt" TIMESTAMPTZ NOT NULL,
    "sentAt" TIMESTAMPTZ,
    "deliveredAt" TIMESTAMPTZ,
    "error" VARCHAR(1000),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "appointment_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "communication_templates_tenantId_idx" ON "communication_templates"("tenantId");

-- CreateIndex
CREATE INDEX "communication_templates_tenantId_category_idx" ON "communication_templates"("tenantId", "category");

-- CreateIndex
CREATE INDEX "communication_preferences_tenantId_patientId_idx" ON "communication_preferences"("tenantId", "patientId");

-- CreateIndex
CREATE UNIQUE INDEX "unique_tenant_patient_comm_pref" ON "communication_preferences"("tenantId", "patientId");

-- CreateIndex
CREATE INDEX "notifications_tenantId_patientId_idx" ON "notifications"("tenantId", "patientId");

-- CreateIndex
CREATE INDEX "notifications_tenantId_userId_idx" ON "notifications"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "notifications_tenantId_type_idx" ON "notifications"("tenantId", "type");

-- CreateIndex
CREATE INDEX "messages_tenantId_patientId_idx" ON "messages"("tenantId", "patientId");

-- CreateIndex
CREATE INDEX "messages_tenantId_channel_idx" ON "messages"("tenantId", "channel");

-- CreateIndex
CREATE INDEX "messages_tenantId_status_idx" ON "messages"("tenantId", "status");

-- CreateIndex
CREATE INDEX "recalls_tenantId_patientId_idx" ON "recalls"("tenantId", "patientId");

-- CreateIndex
CREATE INDEX "recalls_tenantId_status_idx" ON "recalls"("tenantId", "status");

-- CreateIndex
CREATE INDEX "recalls_tenantId_dueDate_idx" ON "recalls"("tenantId", "dueDate");

-- CreateIndex
CREATE INDEX "appointment_reminders_tenantId_appointmentId_idx" ON "appointment_reminders"("tenantId", "appointmentId");

-- CreateIndex
CREATE INDEX "appointment_reminders_tenantId_status_idx" ON "appointment_reminders"("tenantId", "status");
