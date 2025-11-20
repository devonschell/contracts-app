// src/app/api/settings/company/route.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * GET — return all company profile fields, including billingEmail.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const row = await prisma.companyProfile.findUnique({
    where: { clerkUserId: userId },
    select: {
      companyName: true,
      timezone: true,
      currency: true,
      renewalLeadDaysDefault: true,
      billingEmail: true,
    },
  });

  return NextResponse.json({ ok: true, data: row ?? {} });
}

/**
 * POST — update company profile settings.
 * Safe: only updates provided fields, does NOT overwrite billingEmail unless passed in.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const updates: any = {};

  // --- Company Name ---
  if (typeof body.companyName === "string" && body.companyName.trim().length > 0) {
    updates.companyName = body.companyName.trim();
  }

  // --- Timezone ---
  if (typeof body.timezone === "string" && body.timezone.trim().length > 0) {
    updates.timezone = body.timezone.trim();
  }

  // --- Currency ---
  if (typeof body.currency === "string") {
    const c = body.currency.trim().toUpperCase();
    if (/^[A-Z]{3}$/.test(c)) updates.currency = c;
    else
      return NextResponse.json(
        { ok: false, error: "Currency must be 3-letter format (e.g., USD)" },
        { status: 400 },
      );
  }

  // --- Default Renewal Lead Days ---
  if (body.renewalLeadDaysDefault !== undefined) {
    const n = Number(body.renewalLeadDaysDefault);
    if (!Number.isFinite(n) || n < 0 || n > 365) {
      return NextResponse.json(
        { ok: false, error: "Default renewal lead days must be 0–365" },
        { status: 400 },
      );
    }
    updates.renewalLeadDaysDefault = n;
  }

  // --- Billing Email (optional) ---
  if (typeof body.billingEmail === "string" && body.billingEmail.trim().length > 0) {
    const email = body.billingEmail.trim();
    if (!email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "billingEmail must be a valid email." },
        { status: 400 },
      );
    }
    updates.billingEmail = email;
  }

  // Create if none exists
  await prisma.companyProfile.upsert({
    where: { clerkUserId: userId },
    update: updates,
    create: {
      clerkUserId: userId,
      ...updates,
    },
  });

  return NextResponse.json({ ok: true });
}
