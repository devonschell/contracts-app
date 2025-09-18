// src/lib/extractText.ts
import "server-only";

export async function extractTextFromBuffer(buffer: Buffer, originalName: string): Promise<string> {
  const ext = (originalName || "").toLowerCase().split(".").pop() || "";
  try {
    if (ext === "pdf") {
      const pdfParse = (await import("pdf-parse")).default;
      const { text } = await pdfParse(buffer);
      return tidy(text);
    }

    if (ext === "docx" || ext === "doc") {
      const mammoth = (await import("mammoth")).default;
      const { value } = await mammoth.extractRawText({ buffer });
      return tidy(value);
    }

    if (ext === "txt") return tidy(buffer.toString("utf8"));

    // Unknown ext: best-effort UTF-8 if it looks textual
    const guess = buffer.toString("utf8");
    return looksTextual(guess) ? tidy(guess) : "";
  } catch (e: any) {
    console.warn("[extractText] parser failed:", e?.message || e);
    // last-resort: try UTF-8 if it looks like text
    try {
      const guess = buffer.toString("utf8");
      return looksTextual(guess) ? tidy(guess) : "";
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
