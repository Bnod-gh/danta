-- AlterTable
ALTER TABLE "clinical_notes" ADD COLUMN     "aiSummary" VARCHAR(2000),
ADD COLUMN     "assessment" VARCHAR(4000),
ADD COLUMN     "objective" VARCHAR(4000),
ADD COLUMN     "plan" VARCHAR(4000),
ADD COLUMN     "subjective" VARCHAR(4000);
