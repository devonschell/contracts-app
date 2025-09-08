import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const contractId = String(form.get("contractId") || "");
    const override = String(form.get("override") || "false") === "true";

    const files = form.getAll("files") as File[];
    if (!files.length) {
      return NextResponse.json({ ok: false, error: "No files provided" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const saved: { originalName: string; url: string; bytes: number }[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const ext = path.extname(file.name || "") || "";
      const base = path.basename(file.name || "file", ext);
      const hash = crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 8);
      const fname = `${base}-${hash}${ext}`;
      const dest = path.join(uploadDir, fname);

      await writeFile(dest, buffer);
      saved.push({ originalName: file.name, url: `/uploads/${fname}`, bytes: buffer.length });
    }

    return NextResponse.json({ ok: true, contractId, override, files: saved });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ ok: false, error: err?.message || "Upload failed" }, { status: 500 });
  }
}
