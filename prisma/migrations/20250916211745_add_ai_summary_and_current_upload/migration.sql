-- AlterTable
ALTER TABLE "Upload" ADD COLUMN "aiSummary" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clerkUserId" TEXT NOT NULL,
    "counterparty" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "renewalDate" DATETIME,
    "alertsCount" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" DATETIME,
    "currentUploadId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contract_currentUploadId_fkey" FOREIGN KEY ("currentUploadId") REFERENCES "Upload" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Contract" ("alertsCount", "clerkUserId", "counterparty", "createdAt", "deletedAt", "id", "renewalDate", "status", "title", "updatedAt") SELECT "alertsCount", "clerkUserId", "counterparty", "createdAt", "deletedAt", "id", "renewalDate", "status", "title", "updatedAt" FROM "Contract";
DROP TABLE "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";
CREATE UNIQUE INDEX "Contract_currentUploadId_key" ON "Contract"("currentUploadId");
CREATE INDEX "Contract_clerkUserId_idx" ON "Contract"("clerkUserId");
CREATE INDEX "Contract_deletedAt_idx" ON "Contract"("deletedAt");
CREATE INDEX "Contract_updatedAt_idx" ON "Contract"("updatedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
