-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "revokedBy" TEXT;
ALTER TABLE "api_keys" ADD COLUMN     "revocationReason" TEXT;
