import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

// small helpers
function toInt(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}
function toStr(v: any): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}
function isEmail(s: string | null): boolean {
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// GET current profile
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const row = await prisma.companyProfile.findUnique({
    where: { clerkUserId: userId },
    select: {
      companyName: true,
      billingEmail: true,
      timezone: true,
      currency: true,
      renewalLeadDaysDefault: true,
    },
  });

  return NextResponse.json({
    ok: true,
    companyName: row?.companyName ?? "",
    billingEmail: row?.billingEmail ?? "",
    timezone: row?.timezone ?? "",
    currency: row?.currency ?? "",
    renewalLeadDaysDefault: row?.renewalLeadDaysDefault ?? null,
  });
}

// POST -> upsert profile fields
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    let input: Record<string, any> = {};
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      input = (await req.json()) ?? {};
    } else {
      const form = await req.formData();
      form.forEach((v, k) => (input[k] = v));
    }

    const companyName = toStr(input.companyName);
    const billingEmail = toStr(input.billingEmail);
    const timezone = toStr(input.timezone);
    const currency = toStr(input.currency);
    const renewalLeadDaysDefault = toInt(input.renewalLeadDaysDefault);

    if (!companyName) {
      return NextResponse.json({ ok: false, error: "Company name required" }, { status: 400 });
    }
    if (billingEmail && !isEmail(billingEmail)) {
      return NextResponse.json({ ok: false, error: "Invalid billing email" }, { status: 400 });
    }

    await prisma.companyProfile.upsert({
      where: { clerkUserId: userId },
      update: { companyName, billingEmail, timezone, currency, renewalLeadDaysDefault },
      create: { clerkUserId: userId, companyName, billingEmail, timezone, currency, renewalLeadDaysDefault },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[/api/settings] fatal:", e?.message);
    return NextResponse.json({ ok: false, error: "Save failed" }, { status: 500 });
  }
}
