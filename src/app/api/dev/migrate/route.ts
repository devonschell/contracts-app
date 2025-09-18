// src/app/api/dev/migrate/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

async function run() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const [contractsUpdated, uploadsUpdated] = await Promise.all([
    prisma.contract.updateMany({
      where: { clerkUserId: { equals: "" } as any },
      data: { clerkUserId: userId },
    }),
    prisma.upload.updateMany({
      where: { clerkUserId: { equals: "" } as any },
      data: { clerkUserId: userId },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    userId,
    contractsUpdated: contractsUpdated.count,
    uploadsUpdated: uploadsUpdated.count,
  });
}

export async function POST() { return run(); }
export async function GET()  { return run(); }
