-- DropIndex
DROP INDEX "Contract_updatedAt_idx";

-- DropIndex
DROP INDEX "Contract_deletedAt_idx";

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN "autoRenew" BOOLEAN DEFAULT true;
ALTER TABLE "Contract" ADD COLUMN "lateFeePercent" REAL;
ALTER TABLE "Contract" ADD COLUMN "monthlyFeeCents" INTEGER;
ALTER TABLE "Contract" ADD COLUMN "renewalNoticeDays" INTEGER;
ALTER TABLE "Contract" ADD COLUMN "termMonths" INTEGER;
