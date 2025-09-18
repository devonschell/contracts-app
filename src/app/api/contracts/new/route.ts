// src/app/api/contracts/new/route.ts
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

  try {
    const created = await prisma.contract.create({
      data: {
        clerkUserId: userId,
        title: "Untitled Contract",
        status: "ACTIVE",
      },
      select: { id: true },
    });

    // Helpful server log
    console.log("[/api/contracts/new] created", created.id);

    return NextResponse.json({ ok: true, id: created.id });
  } catch (e: any) {
    console.error("[/api/contracts/new] error:", e?.message);
    return NextResponse.json({ ok: false, error: "Failed to create contract" }, { status: 500 });
  }
}
