import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hasBypass(req: NextRequest) {
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return false;
  const h = (req.headers.get("x-cron-secret") || "").trim();
  const q = (new URL(req.url).searchParams.get("key") || "").trim();
  return h === secret || q === secret;
}

export async function GET(req: NextRequest) {
  const bypass = hasBypass(req);
  let userId: string | null = null;

  if (!bypass) {
    const a = await auth();
    userId = a.userId ?? null;
    if (!userId) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status:401 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const includeDeleted = url.searchParams.get("includeDeleted") === "1";

  const where: any = {};
  if (!bypass) where.clerkUserId = userId!;
  if (!includeDeleted) where.deletedAt = null;
  if (q) {
    where.OR = [
      { id: q },
      { title: { contains: q } },
      { counterparty: { contains: q } },
    ];
  }

  const rows = await prisma.contract.findMany({
    where,
    select: {
      id: true,
      title: true,
      counterparty: true,
      renewalDate: true,
      status: true,
      deletedAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ ok:true, data: rows });
}
