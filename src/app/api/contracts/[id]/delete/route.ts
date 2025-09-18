import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const found = await prisma.contract.findFirst({
    where: { id, clerkUserId: userId, deletedAt: null },
    select: { id: true },
  });
  if (!found) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  await prisma.contract.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
