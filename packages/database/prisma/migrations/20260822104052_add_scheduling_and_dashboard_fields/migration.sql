-- AlterTable
ALTER TABLE "appointment_types" ADD COLUMN     "code" VARCHAR(32);

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "scheduledPrice" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "chairs" ADD COLUMN     "description" VARCHAR(255);

-- AlterTable
ALTER TABLE "practices" ADD COLUMN     "dailyProductionTarget" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "code" VARCHAR(32);
