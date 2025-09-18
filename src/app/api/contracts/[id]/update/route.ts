// src/app/api/contracts/[id]/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { extractTextFromBuffer } from "@/lib/extractText";

export const runtime = "node";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    const contentType = req.headers.get("content-type") || "";

    // --- A) Multipart: handle file + optional fields ---
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;

      // Collect any simple scalar fields you already support (optional)
      const data: Record<string, any> = {};
      for (const [k, v] of form.entries()) {
        if (k === "file") continue;
        if (typeof v === "string" && v.length) data[k] = v;
      }

      if (file) {
        const filename = (file as any).name || "document.pdf";
        const ab = await file.arrayBuffer();
        const buffer = Buffer.from(ab);

        // Save file to /public/uploads
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const unique = `${uuidv4()}${path.extname(filename) || ".pdf"}`;
        const dest = path.join(uploadsDir, unique);
        fs.writeFileSync(dest, buffer);

        // Extract text (returns "" for scanned PDFs)
        const extractedText = await extractTextFromBuffer(buffer, filename);

        Object.assign(data, {
          fileName: filename,
          filePath: `/uploads/${unique}`,
          extractedText: extractedText || null,
          lastUpdatedAt: new Date(),
        });
      }

      const updated = await prisma.contract.update({
        where: { id },
        data,
      });

      // If no text came back, surface that in response so UI/AI layer can branch
      if (!updated.extractedText) {
        return NextResponse.json(
          { success: true, contract: updated, status: "NO_TEXT" },
          { status: 202 }
        );
      }

      return NextResponse.json({ success: true, contract: updated });
    }

    // --- B) JSON: keep your existing behavior for metadata-only updates ---
    const body = await req.json().catch(() => ({}));
    const updated = await prisma.contract.update({
      where: { id },
      data: body,
    });
    return NextResponse.json({ success: true, contract: updated });
  } catch (err: any) {
    console.error("contracts.update error:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
