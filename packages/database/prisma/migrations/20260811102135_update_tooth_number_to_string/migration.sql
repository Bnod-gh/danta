/*
  Warnings:

  - You are about to alter the column `toothNumber` on the `imaging_images` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `VarChar(10)`.
  - You are about to alter the column `toothNumber` on the `periodontal_records` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `VarChar(10)`.
  - You are about to alter the column `toothNumber` on the `tooth_conditions` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `VarChar(10)`.

*/
-- AlterTable
ALTER TABLE "imaging_images" ALTER COLUMN "toothNumber" SET DATA TYPE VARCHAR(10);

-- AlterTable
ALTER TABLE "periodontal_records" ALTER COLUMN "toothNumber" SET DATA TYPE VARCHAR(10);

-- AlterTable
ALTER TABLE "tooth_conditions" ALTER COLUMN "toothNumber" SET DATA TYPE VARCHAR(10);
