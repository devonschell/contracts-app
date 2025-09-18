// src/app/api/settings/company/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const row = await prisma.companyProfile.findUnique({ where: { clerkUserId: userId } });
  return NextResponse.json({
    ok: true,
    companyName: row?.companyName ?? null,
    logoUrl: row?.logoUrl ?? null,
  });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { companyName } = await req.json().catch(() => ({}));
  if (!companyName || typeof companyName !== "string") {
    return NextResponse.json({ ok: false, error: "companyName required" }, { status: 400 });
  }

  await prisma.companyProfile.upsert({
    where: { clerkUserId: userId },
    update: { companyName },
    create: { clerkUserId: userId, companyName },
  });

  return NextResponse.json({ ok: true });
}
