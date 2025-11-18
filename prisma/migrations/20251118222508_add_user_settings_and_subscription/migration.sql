-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "priceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "allowedEmails" INTEGER NOT NULL DEFAULT 1,
    "selectedEmails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_clerkUserId_key" ON "UserSubscription"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_clerkUserId_key" ON "UserSettings"("clerkUserId");
