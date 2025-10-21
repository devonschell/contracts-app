// src/lib/extractText.ts
import "server-only";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const pexecFile = promisify(execFile);

// AWS SDK v3
import {
  TextractClient,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
  Block,
} from "@aws-sdk/client-textract";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

export type ExtractOpts = { allowOCR?: boolean; ocrPages?: number; ocrDPI?: number };

export async function extractTextFromBuffer(
  buffer: Buffer,
  originalName: string,
  opts: ExtractOpts = {}
): Promise<string> {
  const kind = detectKind(buffer, originalName);

  if (kind === "pdf") {
    // 1) pdf-parse
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const { text } = await pdfParse(buffer);
      const t = tidy(text);
      if (t.length > 40) return t;
    } catch {}

    // 2) pdfjs-dist
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
    } catch {}

    // 3) Hosted fallback: AWS Textract (works on Vercel)
    const hasAws =
      !!process.env.AWS_ACCESS_KEY_ID &&
      !!process.env.AWS_SECRET_ACCESS_KEY &&
      !!process.env.AWS_REGION &&
      !!process.env.S3_BUCKET;

    if (hasAws) {
      try {
        const t = await ocrPdfWithTextract(buffer, {
          region: process.env.AWS_REGION!,
          bucket: process.env.S3_BUCKET!,
        });
        const cleaned = tidy(t);
        if (cleaned.length > 20) return cleaned;
      } catch (e: any) {
        console.warn("[extractText][Textract] failed:", e?.message || e);
      }
    }

    // 4) Local CLI OCR (works locally, not on Vercel)
    if (opts.allowOCR) {
      try {
        const t = await ocrPdfCLI(buffer, {
          pages: Math.max(1, Math.min(opts.ocrPages ?? 3, 10)),
          dpi: opts.ocrDPI ?? 200,
        });
        const cleaned = tidy(t);
        if (cleaned.length > 20) return cleaned;
      } catch (e: any) {
        console.warn("[extractText][OCR-CLI] failed:", e?.message || e);
      }
    }
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

  if (kind === "txt") return tidy(buffer.toString("utf8"));

  const guess = buffer.toString("utf8");
  return looksTextual(guess) ? tidy(guess) : "";
}

/* ---------- AWS Textract fallback ---------- */
async function ocrPdfWithTextract(
  buffer: Buffer,
  cfg: { region: string; bucket: string }
) {
  const s3 = new S3Client({ region: cfg.region });
  const textract = new TextractClient({ region: cfg.region });

  const key = `ocr-tmp/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;

  // 1) upload temp object to S3
  await s3.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: buffer,
      ContentType: "application/pdf",
    })
  );

  try {
    // 2) start async text detection
    const start = await textract.send(
      new StartDocumentTextDetectionCommand({
        DocumentLocation: { S3Object: { Bucket: cfg.bucket, Name: key } },
      })
    );
    const jobId = start.JobId!;
    let status = "IN_PROGRESS";
    let nextToken: string | undefined;
    const lines: string[] = [];

    // 3) poll results
    while (status === "IN_PROGRESS") {
      await sleep(2000);
      const resp = await textract.send(
        new GetDocumentTextDetectionCommand({ JobId: jobId, NextToken: nextToken })
      );
      status = resp.JobStatus || "IN_PROGRESS";
      nextToken = resp.NextToken;

      if (resp.Blocks) {
        for (const b of resp.Blocks as Block[]) {
          if (b.BlockType === "LINE" && b.Text) lines.push(b.Text);
        }
      }

      if (!nextToken && (status === "SUCCEEDED" || status === "FAILED" || status === "PARTIAL_SUCCESS")) {
        break;
      }
    }

    if (status !== "SUCCEEDED" && status !== "PARTIAL_SUCCESS") {
      throw new Error(`Textract job status: ${status}`);
    }

    return lines.join("\n");
  } finally {
    // 4) clean up temp object
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }));
    } catch {}
  }
}

/* ---------- Local OCR via CLI (Poppler + Tesseract) ---------- */
async function ocrPdfCLI(buffer: Buffer, opts: { pages: number; dpi: number }) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ocr-"));
  const pdfPath = path.join(tmpDir, "in.pdf");
  await fs.writeFile(pdfPath, buffer);
  const prefix = path.join(tmpDir, "page");
  const PATH = `${process.env.PATH || ""}:/opt/homebrew/bin:/usr/local/bin`;

  // PDF -> PNG
  await pexecFile(
    "pdftoppm",
    ["-png", "-r", String(opts.dpi), "-f", "1", "-l", String(opts.pages), pdfPath, prefix],
    { env: { ...process.env, PATH } }
  );

  // OCR each page
  let text = "";
  for (let p = 1; p <= opts.pages; p++) {
    const imgPath = `${prefix}-${p}.png`;
    try {
      const { stdout } = await pexecFile("tesseract", [imgPath, "-", "-l", "eng", "--psm", "6"], {
        env: { ...process.env, PATH },
        maxBuffer: 50 * 1024 * 1024,
      });
      text += stdout + "\n";
    } catch {
      break;
    }
  }

  try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch {}
  return text;
}

/* ---------- misc helpers ---------- */
function detectKind(buffer: Buffer, originalName?: string) {
  if (isPDF(buffer)) return "pdf";
  if (isDOCXZip(buffer)) return "docx";
  if (looksTextual(buffer.toString("utf8"))) return "txt";
  const ext = (originalName || "").toLowerCase().split(".").pop() || "";
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (ext === "txt") return "txt";
  return "unknown" as const;
}
function isPDF(buf: Buffer) {
  return buf.length >= 5 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46 && buf[4] === 0x2d;
}
function isDOCXZip(buf: Buffer) {
  return buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
}
function tidy(s: string) {
  const clipped = (s || "").slice(0, 400_000);
  return clipped.replace(/\u0000/g, " ").replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function looksTextual(s: string) {
  if (!s) return false;
  const printable = s.split("").filter((c) => /[\x09\x0A\x0D\x20-\x7E]/.test(c)).length;
  return printable / s.length > 0.9;
}
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
