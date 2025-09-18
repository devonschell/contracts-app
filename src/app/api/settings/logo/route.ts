// src/app/api/settings/logo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

const MAX = 5 * 1024 * 1024;
const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const row = await prisma.companyProfile.findUnique({ where: { clerkUserId: userId } });
  return NextResponse.json({ ok: true, logoUrl: row?.logoUrl ?? null });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });
    if (!ACCEPT.includes(file.type)) return NextResponse.json({ ok: false, error: "Unsupported type" }, { status: 415 });
    if (file.size > MAX) return NextResponse.json({ ok: false, error: "Too large" }, { status: 413 });

    const ext = extFromMime(file.type);
    const name = `logo-${userId}-${Date.now()}${ext}`;
    const rel = `/brand/${name}`;
    const absDir = path.join(process.cwd(), "public", "brand");
    await fs.mkdir(absDir, { recursive: true });
    await fs.writeFile(path.join(absDir, name), Buffer.from(await file.arrayBuffer()));

    await prisma.companyProfile.upsert({
      where: { clerkUserId: userId },
      update: { logoUrl: rel },
      create: { clerkUserId: userId, companyName: "", logoUrl: rel },
    });

    return NextResponse.json({ ok: true, logoUrl: rel });
  } catch (e) {
    console.error("[/api/settings/logo] fatal:", e);
    return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  await prisma.companyProfile.update({
    where: { clerkUserId: userId },
    data: { logoUrl: null },
  }).catch(() => {});
  return NextResponse.json({ ok: true });
}

function extFromMime(type: string) {
  if (type === "image/png") return ".png";
  if (type === "image/jpeg") return ".jpg";
  if (type === "image/webp") return ".webp";
  if (type === "image/svg+xml") return ".svg";
  return "";
}
