// src/app/api/onboarding/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { step } = body;

    // Validate step
    if (typeof step !== "number" || step < 1 || step > 3) {
      return NextResponse.json({ error: "Invalid step (must be 1-3)" }, { status: 400 });
    }

    // Update or create UserSettings
    await prisma.userSettings.upsert({
      where: { clerkUserId: userId },
      update: { onboardingStep: step },
      create: {
        clerkUserId: userId,
        onboardingStep: step,
        allowedEmails: 1,
      },
    });

    return NextResponse.json({ success: true, step });
  } catch (err) {
    console.error("Onboarding update error:", err);
    return NextResponse.json({ error: "Failed to update onboarding" }, { status: 500 });
  }
}

// GET current onboarding step
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.userSettings.findUnique({
      where: { clerkUserId: userId },
      select: { onboardingStep: true },
    });

    return NextResponse.json({
      onboardingStep: settings?.onboardingStep ?? 0,
    });
  } catch (err) {
    console.error("Onboarding fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
