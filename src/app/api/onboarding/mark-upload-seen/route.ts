// src/app/api/onboarding/mark-upload-seen/route.ts
import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.userSettings.findUnique({
    where: { clerkUserId: userId },
    select: { onboardingStep: true },
  });

  const current = existing?.onboardingStep ?? 0;
  const next = current >= 2 ? current : 2;

  await prisma.userSettings.upsert({
    where: { clerkUserId: userId },
    update: { onboardingStep: next },
    create: {
      clerkUserId: userId,
      onboardingStep: next,
    },
  });

  return NextResponse.json({ ok: true, onboardingStep: next });
}
