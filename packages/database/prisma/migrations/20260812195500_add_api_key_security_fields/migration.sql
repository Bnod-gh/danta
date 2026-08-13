-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('DEV', 'STAGING', 'PROD');

-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "api_keys" ADD COLUMN     "env" "Environment" NOT NULL DEFAULT 'PROD';
ALTER TABLE "api_keys" ADD COLUMN     "rateLimit" JSONB;
ALTER TABLE "api_keys" ADD COLUMN     "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropIndex
DROP INDEX "api_keys_keyHash_idx";

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyPrefix_key" ON "api_keys"("keyPrefix");
