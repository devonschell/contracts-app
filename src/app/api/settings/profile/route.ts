import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const row = await prisma.companyProfile.findUnique({
    where: { clerkUserId: userId },
    select: {
      companyName: true,
      timezone: true,
      currency: true,
      renewalLeadDaysDefault: true,
    },
  });

  return NextResponse.json({ ok: true, data: row ?? {} });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const companyName = String(body?.companyName ?? "").trim();
  const timezone = String(body?.timezone ?? "").trim();
  const currency = String(body?.currency ?? "").trim().toUpperCase();
  const renewalLeadDaysDefault = Number(body?.renewalLeadDaysDefault ?? "");

  if (!companyName) return NextResponse.json({ ok: false, error: "Company name required" }, { status: 400 });
  if (!timezone) return NextResponse.json({ ok: false, error: "Timezone required" }, { status: 400 });
  if (!/^[A-Z]{3}$/.test(currency)) return NextResponse.json({ ok: false, error: "Currency must be a 3-letter code" }, { status: 400 });
  if (!Number.isFinite(renewalLeadDaysDefault) || renewalLeadDaysDefault < 0 || renewalLeadDaysDefault > 365) {
    return NextResponse.json({ ok: false, error: "Default renewal lead days must be 0–365" }, { status: 400 });
  }

  await prisma.companyProfile.upsert({
    where: { clerkUserId: userId },
    update: { companyName, timezone, currency, renewalLeadDaysDefault },
    create: { clerkUserId: userId, companyName, timezone, currency, renewalLeadDaysDefault },
  });

  return NextResponse.json({ ok: true });
}
