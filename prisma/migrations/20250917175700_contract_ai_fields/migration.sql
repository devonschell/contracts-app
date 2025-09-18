-- AlterTable
ALTER TABLE "Contract" ADD COLUMN "annualFee" REAL;
ALTER TABLE "Contract" ADD COLUMN "billingCadence" TEXT;
ALTER TABLE "Contract" ADD COLUMN "endDate" DATETIME;
ALTER TABLE "Contract" ADD COLUMN "lateFeePct" REAL;
ALTER TABLE "Contract" ADD COLUMN "monthlyFee" REAL;
ALTER TABLE "Contract" ADD COLUMN "paymentCadence" TEXT;
ALTER TABLE "Contract" ADD COLUMN "startDate" DATETIME;
ALTER TABLE "Contract" ADD COLUMN "termLengthMonths" INTEGER;
ALTER TABLE "Contract" ADD COLUMN "terminationRights" JSONB;
ALTER TABLE "Contract" ADD COLUMN "unusualClauses" JSONB;
