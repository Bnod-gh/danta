-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "graceExpiresAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "api_keys" ADD COLUMN     "previousKeyId" UUID;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_previousKeyId_fkey" FOREIGN KEY ("previousKeyId") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;
