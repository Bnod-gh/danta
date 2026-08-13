-- AlterTable
ALTER TABLE "login_attempts" ADD COLUMN     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "login_attempts_lastAttemptAt_idx" ON "login_attempts"("lastAttemptAt");
