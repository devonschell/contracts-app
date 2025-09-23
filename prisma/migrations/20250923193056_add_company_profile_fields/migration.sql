/*
  Warnings:

  - You are about to drop the column `alertsCount` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `lateFeePercent` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyFeeCents` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `termMonths` on the `Contract` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CompanyProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "companyName" TEXT,
    "logoUrl" TEXT,
    "billingEmail" TEXT,
    "timezone" TEXT,
    "currency" TEXT,
    "renewalLeadDaysDefault" INTEGER,
    "notificationEmails" JSONB,
    "weeklyDigest" BOOLEAN
);
INSERT INTO "new_CompanyProfile" ("clerkUserId", "companyName", "createdAt", "id", "updatedAt") SELECT "clerkUserId", "companyName", "createdAt", "id", "updatedAt" FROM "CompanyProfile";
DROP TABLE "CompanyProfile";
ALTER TABLE "new_CompanyProfile" RENAME TO "CompanyProfile";
CREATE UNIQUE INDEX "CompanyProfile_clerkUserId_key" ON "CompanyProfile"("clerkUserId");
CREATE TABLE "new_Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "clerkUserId" TEXT NOT NULL,
    "title" TEXT,
    "counterparty" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "renewalDate" DATETIME,
    "autoRenew" BOOLEAN,
    "monthlyFee" REAL,
    "annualFee" REAL,
    "lateFeePct" REAL,
    "renewalNoticeDays" INTEGER,
    "termLengthMonths" INTEGER,
    "billingCadence" TEXT,
    "paymentCadence" TEXT,
    "unusualClauses" JSONB,
    "terminationRights" JSONB,
    "currentUploadId" TEXT,
    CONSTRAINT "Contract_currentUploadId_fkey" FOREIGN KEY ("currentUploadId") REFERENCES "Upload" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Contract" ("annualFee", "autoRenew", "billingCadence", "clerkUserId", "counterparty", "createdAt", "currentUploadId", "deletedAt", "endDate", "id", "lateFeePct", "monthlyFee", "paymentCadence", "renewalDate", "renewalNoticeDays", "startDate", "status", "termLengthMonths", "terminationRights", "title", "unusualClauses", "updatedAt") SELECT "annualFee", "autoRenew", "billingCadence", "clerkUserId", "counterparty", "createdAt", "currentUploadId", "deletedAt", "endDate", "id", "lateFeePct", "monthlyFee", "paymentCadence", "renewalDate", "renewalNoticeDays", "startDate", "status", "termLengthMonths", "terminationRights", "title", "unusualClauses", "updatedAt" FROM "Contract";
DROP TABLE "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";
CREATE UNIQUE INDEX "Contract_currentUploadId_key" ON "Contract"("currentUploadId");
CREATE INDEX "Contract_clerkUserId_idx" ON "Contract"("clerkUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
