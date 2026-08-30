-- AlterTable
ALTER TABLE "treatment_history" ADD COLUMN     "planItemId" UUID,
ADD COLUMN     "surfaces" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "toothNumber" VARCHAR(10);

-- CreateIndex
CREATE INDEX "treatment_history_tenantId_toothNumber_idx" ON "treatment_history"("tenantId", "toothNumber");

-- AddForeignKey
ALTER TABLE "treatment_history" ADD CONSTRAINT "treatment_history_planItemId_fkey" FOREIGN KEY ("planItemId") REFERENCES "treatment_plan_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
