import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  // verify ownership
  const c = await prisma.contract.findFirst({
    where: { id, clerkUserId: userId },
    include: { uploads: true },
  });
  if (!c) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  // try deleting uploaded files from disk (best-effort)
  for (const u of c.uploads) {
    const rel = u.url?.startsWith("/") ? u.url : `/${u.url}`;
    const abs = path.join(process.cwd(), "public", rel);
    fs.unlink(abs).catch(() => {});
  }

  // delete children first, then contract
  await prisma.upload.deleteMany({ where: { contractId: id } });
  await prisma.contract.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
