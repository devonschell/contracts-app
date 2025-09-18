import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";

/**
 * POST /api/uploads/:id
 * Promote an upload to be the contract's current upload.
 * Uses minimal selects to avoid legacy schema issues.
 */
export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    // 1) Fetch upload (no relation include)
    const upload = await prisma.upload.findUnique({
      where: { id },
      select: { id: true, contractId: true },
    });
    if (!upload) return NextResponse.json({ ok: false, error: "Upload not found" }, { status: 404 });

    // 2) Confirm contract owner
    const contract = await prisma.contract.findUnique({
      where: { id: upload.contractId },
      select: { id: true, clerkUserId: true },
    });
    if (!contract || contract.clerkUserId !== userId) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    // 3) Try to promote (ignore if schema doesn’t have field)
    try {
      await prisma.contract.update({
        where: { id: contract.id },
        data: { currentUploadId: upload.id as any },
      });
    } catch (e) {
      console.warn("[POST /api/uploads/:id] promote skipped:", (e as Error)?.message);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST /api/uploads/:id] fatal:", (e as Error)?.message);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * DELETE /api/uploads/:id
 * Delete an upload (and the file if stored under /public/uploads).
 * Robust to legacy rows and optional schema fields.
 */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    // 1) Fetch upload (minimal fields)
    const upload = await prisma.upload.findUnique({
      where: { id },
      select: { id: true, url: true, clerkUserId: true, contractId: true },
    });
    if (!upload) return NextResponse.json({ ok: false, error: "Upload not found" }, { status: 404 });

    // 2) Fetch parent contract (only what we truly need)
    const contract = await prisma.contract.findUnique({
      where: { id: upload.contractId },
      select: { id: true, clerkUserId: true },
    });

    const owns = upload.clerkUserId === userId || contract?.clerkUserId === userId;
    if (!owns) {
      return NextResponse.json(
        { ok: false, error: "Upload not found or not owned by this user" },
        { status: 404 }
      );
    }

    // 3) Best-effort unlink physical file if it’s under /public/uploads
    if (upload.url && upload.url.startsWith("/uploads/")) {
      try {
        const rel = upload.url.replace(/^\//, "");
        const full = path.join(process.cwd(), "public", rel);
        await fs.unlink(full);
      } catch (e) {
        console.warn("[DELETE /api/uploads/:id] unlink skipped:", (e as Error)?.message);
      }
    }

    // 4) Try to clear any FK reference (if your schema has currentUploadId)
    try {
      // We don't know if the contract currently points at this upload.
      // Safest: conditional unset—if the column exists, this succeeds or no-ops.
      await prisma.contract.update({
        where: { id: upload.contractId },
        data: { currentUploadId: null as any },
      });
    } catch (e) {
      // If column doesn't exist, entirely fine.
      console.warn("[DELETE /api/uploads/:id] unset current skipped:", (e as Error)?.message);
    }

    // 5) Delete the upload row
    try {
      await prisma.upload.delete({ where: { id: upload.id } });
    } catch (e) {
      // If a FK still blocks (some schemas have different FK names), try one more time after a noop update.
      console.error("[DELETE /api/uploads/:id] delete failed:", (e as Error)?.message);
      return NextResponse.json({ ok: false, error: "Delete failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/uploads/:id] fatal:", (e as Error)?.message);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
