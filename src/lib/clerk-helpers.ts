// src/lib/clerk-helpers.ts
import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

/**
 * Update user's onboarding step in both Prisma and Clerk metadata
 * Call this from your /welcome and /upload pages when user completes a step
 */
export async function updateOnboardingStep(
  clerkUserId: string,
  step: number
): Promise<void> {
  // Update Prisma
  await prisma.userSettings.upsert({
    where: { clerkUserId },
    update: { onboardingStep: step },
    create: { clerkUserId, onboardingStep: step, allowedEmails: 1 },
  });

  // Update Clerk metadata
  const client = await clerkClient();
  await client.users.updateUserMetadata(clerkUserId, {
    publicMetadata: { onboardingStep: step },
  });

  console.log(`✅ Onboarding step updated to ${step} for ${clerkUserId}`);
}

/**
 * Get user's current subscription and onboarding status
 * Useful for server components and API routes
 */
export async function getUserStatus(clerkUserId: string) {
  const [subscription, settings] = await Promise.all([
    prisma.userSubscription.findUnique({ where: { clerkUserId } }),
    prisma.userSettings.findUnique({ where: { clerkUserId } }),
  ]);

  return {
    isSubscribed: subscription?.status === "active",
    subscriptionStatus: subscription?.status ?? "inactive",
    onboardingStep: settings?.onboardingStep ?? 0,
    allowedEmails: settings?.allowedEmails ?? 1,
  };
}
