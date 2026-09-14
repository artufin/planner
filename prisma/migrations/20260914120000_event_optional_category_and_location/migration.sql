-- AlterTable
ALTER TABLE "PlannerEvent" ADD COLUMN     "location" TEXT,
ALTER COLUMN "categoryId" DROP NOT NULL;
