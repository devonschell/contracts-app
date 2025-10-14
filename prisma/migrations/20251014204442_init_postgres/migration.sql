-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('RENEWAL_ALERT', 'WEEKLY_DIGEST', 'TEST');

-- CreateTable
CREATE TABLE "public"."Contract" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "clerkUserId" TEXT NOT NULL,
    "title" TEXT,
    "counterparty" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "renewalDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN,
    "monthlyFee" DOUBLE PRECISION,
    "annualFee" DOUBLE PRECISION,
    "lateFeePct" DOUBLE PRECISION,
    "renewalNoticeDays" INTEGER,
    "termLengthMonths" INTEGER,
    "billingCadence" TEXT,
    "paymentCadence" TEXT,
    "unusualClauses" JSONB,
    "terminationRights" JSONB,
    "currentUploadId" TEXT,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Upload" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contractId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "aiSummary" TEXT,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CompanyProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "companyName" TEXT,
    "logoUrl" TEXT,
    "billingEmail" TEXT,
    "timezone" TEXT,
    "currency" TEXT,
    "renewalLeadDaysDefault" INTEGER,
    "notificationEmails" JSONB,
    "weeklyDigest" BOOLEAN,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationPrefs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "recipientsCsv" TEXT NOT NULL DEFAULT '',
    "renewalAlerts" BOOLEAN NOT NULL DEFAULT true,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "noticeDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPrefs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contractId" TEXT,
    "type" "public"."NotificationType" NOT NULL,
    "subject" TEXT NOT NULL,
    "sentTo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contract_currentUploadId_key" ON "public"."Contract"("currentUploadId");

-- CreateIndex
CREATE INDEX "Contract_clerkUserId_idx" ON "public"."Contract"("clerkUserId");

-- CreateIndex
CREATE INDEX "Upload_contractId_idx" ON "public"."Upload"("contractId");

-- CreateIndex
CREATE INDEX "Upload_clerkUserId_idx" ON "public"."Upload"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProfile_clerkUserId_key" ON "public"."CompanyProfile"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPrefs_companyId_key" ON "public"."NotificationPrefs"("companyId");

-- CreateIndex
CREATE INDEX "NotificationLog_companyId_idx" ON "public"."NotificationLog"("companyId");

-- CreateIndex
CREATE INDEX "NotificationLog_contractId_idx" ON "public"."NotificationLog"("contractId");

-- AddForeignKey
ALTER TABLE "public"."Contract" ADD CONSTRAINT "Contract_currentUploadId_fkey" FOREIGN KEY ("currentUploadId") REFERENCES "public"."Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Upload" ADD CONSTRAINT "Upload_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "public"."Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationPrefs" ADD CONSTRAINT "NotificationPrefs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."CompanyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationLog" ADD CONSTRAINT "NotificationLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."CompanyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationLog" ADD CONSTRAINT "NotificationLog_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "public"."Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
