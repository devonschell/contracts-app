// src/lib/extractText.ts
import "server-only";

export async function extractTextFromBuffer(
  buffer: Buffer,
  originalName: string
): Promise<string> {
  const ext = (originalName || "").toLowerCase().split(".").pop() || "";

  try {
    if (ext === "pdf") {
      // ---- Try 1: pdf-parse ----
      try {
        const pdfParse = (await import("pdf-parse")).default;
        const { text, numpages } = await pdfParse(buffer);
        const t = tidy(text);
        console.info(`[extractText] pdf-parse pages=${numpages ?? "?"} chars=${t.length}`);
        if (t.length > 40) return t;
      } catch (e) {
        console.warn("[extractText] pdf-parse failed:", (e as any)?.message || e);
      }

      // ---- Try 2: pdfjs-dist (handles tricky PDFs) ----
      try {
        // legacy build works well on Node
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
        console.info(`[extractText] pdfjs-dist pages=${pdf.numPages} chars=${t.length}`);
        if (t.length > 40) return t;
      } catch (e) {
        console.warn("[extractText] pdfjs-dist fallback failed:", (e as any)?.message || e);
      }

      // If we’re here, it’s almost certainly a scanned-image PDF (no text layer)
      console.info("[extractText] No text layer found; likely OCR needed.");
      return "";
    }

    if (ext === "docx" || ext === "doc") {
      const mammoth = (await import("mammoth")).default;
      const { value } = await mammoth.extractRawText({ buffer });
      const t = tidy(value);
      console.info(`[extractText] mammoth chars=${t.length}`);
      return t;
    }

    if (ext === "txt") {
      const t = tidy(buffer.toString("utf8"));
      console.info(`[extractText] txt chars=${t.length}`);
      return t;
    }

    // Unknown ext: best-effort UTF-8 if it looks textual
    const guess = buffer.toString("utf8");
    const t = looksTextual(guess) ? tidy(guess) : "";
    console.info(`[extractText] unknown-ext chars=${t.length}`);
    return t;
  } catch (e: any) {
    console.warn("[extractText] parser failed:", e?.message || e);
    try {
      const guess = buffer.toString("utf8");
      const t = looksTextual(guess) ? tidy(guess) : "";
      console.info(`[extractText] last-resort chars=${t.length}`);
      return t;
    } catch {
      return "";
    }
  }
}

function tidy(s: string) {
  const clipped = (s || "").slice(0, 200_000);
  return clipped.replace(/\u0000/g, " ")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
function looksTextual(s: string) {
  if (!s) return false;
  const printable = s.split("").filter(c => /[\x09\x0A\x0D\x20-\x7E]/.test(c)).length;
  return printable / s.length > 0.9;
}
