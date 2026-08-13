/*
  Warnings:

  - You are about to alter the column `cost` on the `treatment_history` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "treatment_history" ALTER COLUMN "cost" SET DATA TYPE DECIMAL(10,2);
