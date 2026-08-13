-- CreateTable
CREATE TABLE "login_attempts" (
    "email" VARCHAR(255) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMPTZ,
    "lastAttemptAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE INDEX "login_attempts_lockedUntil_idx" ON "login_attempts"("lockedUntil");
