-- AlterTable
ALTER TABLE "dental_charts" ADD COLUMN     "dentition" TEXT NOT NULL DEFAULT 'primary';

-- AlterTable
ALTER TABLE "procedure_codes" ADD COLUMN     "chartDefaultSurfaces" TEXT[],
ADD COLUMN     "chartTargetCondition" TEXT,
ADD COLUMN     "icon" TEXT;

-- AlterTable
ALTER TABLE "tooth_conditions" ADD COLUMN     "dentition" TEXT NOT NULL DEFAULT 'primary',
ADD COLUMN     "procedureCodeId" UUID,
ADD COLUMN     "scope" TEXT NOT NULL DEFAULT 'global';

-- AlterTable
ALTER TABLE "tooth_conditions" ALTER COLUMN "toothNumber" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "tooth_conditions_tenantId_dentalChartId_dentition_idx" ON "tooth_conditions"("tenantId", "dentalChartId", "dentition");

-- CreateIndex
CREATE INDEX "tooth_conditions_tenantId_scope_idx" ON "tooth_conditions"("tenantId", "scope");

-- AddForeignKey
ALTER TABLE "tooth_conditions" ADD CONSTRAINT "tooth_conditions_procedureCodeId_fkey" FOREIGN KEY ("procedureCodeId") REFERENCES "procedure_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
