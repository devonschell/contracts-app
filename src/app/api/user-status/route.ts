// src/app/api/user-status/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { isSubscribed: false, onboardingStep: 0 },
      { status: 401 }
    );
  }

  try {
    // Fetch subscription and settings in parallel
    const [subscription, settings] = await Promise.all([
      prisma.userSubscription.findUnique({
        where: { clerkUserId: userId },
        select: { status: true },
      }),
      prisma.userSettings.findUnique({
        where: { clerkUserId: userId },
        select: { onboardingStep: true },
      }),
    ]);

    const isSubscribed = subscription?.status === "active";
    const onboardingStep = settings?.onboardingStep ?? 0;

    return NextResponse.json({
      isSubscribed,
      onboardingStep,
    });
  } catch (err) {
    console.error("user-status error:", err);
    return NextResponse.json(
      { isSubscribed: false, onboardingStep: 0 },
      { status: 500 }
    );
  }
}
