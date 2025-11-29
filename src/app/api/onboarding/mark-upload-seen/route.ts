// src/app/api/onboarding/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateOnboardingStep } from "@/lib/clerk-helpers";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { step } = body;

    if (typeof step !== "number" || step < 0 || step > 3) {
      return NextResponse.json({ error: "Invalid step" }, { status: 400 });
    }

    await updateOnboardingStep(userId, step);

    return NextResponse.json({ success: true, step });
  } catch (error) {
    console.error("Onboarding update error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
