import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

// GET current company name
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const row = await prisma.companyProfile.findUnique({
    where: { clerkUserId: userId },
    select: { companyName: true },
  });

  return NextResponse.json({ ok: true, companyName: row?.companyName ?? "" });
}

// POST { companyName } -> upsert
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    let companyName = "";
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const body = await req.json();
      companyName = String(body?.companyName || "").trim();
    } else {
      const form = await req.formData();
      companyName = String(form.get("companyName") || "").trim();
    }

    if (!companyName) {
      return NextResponse.json({ ok: false, error: "Company name required" }, { status: 400 });
    }

    await prisma.companyProfile.upsert({
      where: { clerkUserId: userId },
      update: { companyName },
      create: { clerkUserId: userId, companyName },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[/api/settings] fatal:", e?.message);
    return NextResponse.json({ ok: false, error: "Save failed" }, { status: 500 });
  }
}
