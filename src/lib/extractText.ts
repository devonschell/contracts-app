// src/lib/extractText.ts
import "server-only";

/**
 * Robust text extraction:
 * - Detects kind via magic bytes (not filename)
 * - PDF: pdf-parse, then pdfjs-dist fallback
 * - DOCX: mammoth
 * - TXT: utf8 if textual
 * - Otherwise returns "" (so caller can branch to OCR if needed)
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  originalName: string
): Promise<string> {
  const kind = detectKind(buffer, originalName);

  if (kind === "pdf") {
    // ---- Try 1: pdf-parse (fast) ----
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const { text } = await pdfParse(buffer);
      const t = tidy(text);
      if (t.length > 40) return t;
    } catch (e) {
      // fall through
    }

    // ---- Try 2: pdfjs-dist (handles many tricky PDFs) ----
    try {
      const pdfjsLib: any = await import("pdfjs-dist/legacy/build/pdf.js");
      const loadingTask = pdfjsLib.getDocument({ data: buffer });
      const pdf = await loadingTask.promise;

      let out = "";
      const take = Math.min(pdf.numPages || 1, 50);
      for (let i = 1; i <= take; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const items = (content.items || []) as Array<{ str?: string }>;
        out += items.map((it) => it.str ?? "").join(" ") + "\n";
      }
      const t = tidy(out);
      if (t.length > 40) return t;
    } catch {
      // ignore
    }

    // Likely scanned / outlined / encrypted
    return "";
  }

  if (kind === "docx") {
    try {
      const mammoth = (await import("mammoth")).default;
      const { value } = await mammoth.extractRawText({ buffer });
      return tidy(value);
    } catch {
      return "";
    }
  }

  if (kind === "txt") {
    return tidy(buffer.toString("utf8"));
  }

  // Unknown: last-resort best guess
  const guess = buffer.toString("utf8");
  return looksTextual(guess) ? tidy(guess) : "";
}

/* ---------- helpers ---------- */

function detectKind(buffer: Buffer, originalName?: string) {
  // 1) Magic bytes first (most reliable)
  if (isPDF(buffer)) return "pdf";
  if (isDOCXZip(buffer)) return "docx";
  if (looksTextual(buffer.toString("utf8"))) return "txt";

  // 2) Only then fall back to extension if present
  const ext = (originalName || "").toLowerCase().split(".").pop() || "";
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (ext === "txt") return "txt";

  return "unknown" as const;
}

function isPDF(buf: Buffer) {
  // %PDF- (25 50 44 46 2D)
  if (buf.length < 5) return false;
  return buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46 && buf[4] === 0x2d;
}

function isDOCXZip(buf: Buffer) {
  // ZIP local header: PK\x03\x04
  if (buf.length < 4) return false;
  const isZip = buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
  return isZip; // good enough; mammoth will fail fast if it's not a docx
}

function tidy(s: string) {
  const clipped = (s || "").slice(0, 200_000);
  return clipped
    .replace(/\u0000/g, " ")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function looksTextual(s: string) {
  if (!s) return false;
  const printable = s.split("").filter((c) => /[\x09\x0A\x0D\x20-\x7E]/.test(c)).length;
  return printable / s.length > 0.9;
}
