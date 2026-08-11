/*
  Warnings:

  - The `status` column on the `imaging_studies` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ImagingStudyStatus" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- AlterTable
ALTER TABLE "imaging_studies" DROP COLUMN "status",
ADD COLUMN     "status" "ImagingStudyStatus" NOT NULL DEFAULT 'pending';

-- AddForeignKey
ALTER TABLE "imaging_studies" ADD CONSTRAINT "imaging_studies_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
