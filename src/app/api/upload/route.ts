import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";
import { summarizeContract, extractContractMeta } from "@/lib/ai";
import { extractTextFromBuffer } from "@/lib/extractText";
import { put } from "@vercel/blob"; // <-- NEW

export const runtime = "nodejs";
export const maxUploadSize = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const form = await req.formData();

    // Optional contractId; if missing, create a contract on the fly
    let contractId = String(form.get("contractId") || "");
    let contract: { id: string; currentUploadId: string | null } | null = null;

    if (contractId) {
      contract = await prisma.contract.findFirst({
        where: { id: contractId, clerkUserId: userId, deletedAt: null },
        select: { id: true, currentUploadId: true },
      });
      if (!contract) {
        return NextResponse.json({ ok: false, error: "Contract not found" }, { status: 404 });
      }
    } else {
      const created = await prisma.contract.create({
        data: { clerkUserId: userId },
        select: { id: true, currentUploadId: true },
      });
      contract = created;
      contractId = created.id;
      console.log("[upload] created contract on-the-fly:", contractId);
    }

    const override = String(form.get("override") || "") === "true";

    const file =
      (form.get("file") as File | null) ||
      (form.get("files") as File | null) ||
      (form.get("upload") as File | null) ||
      null;

    if (!(file instanceof File)) {
      console.error("[upload] No File in form. Keys:", Array.from(form.keys()));
      return NextResponse.json({ ok: false, error: "No file provided (use field 'file')." }, { status: 400 });
    }
    if (file.size > maxUploadSize) return NextResponse.json({ ok: false, error: "File too large" }, { status: 413 });

    const originalName = (file as any).name || "upload";
    const ext = safeExt(originalName);
    const filename = `${Date.now()}-${randomId(8)}${ext}`;
    const key = `uploads/${filename}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // ---------- STORE THE FILE ----------
    const isVercel = !!process.env.VERCEL;
    let storedUrl: string;

    if (isVercel) {
      // Vercel (production): store in Blob
      // Requires: BLOB_READ_WRITE_TOKEN set in Vercel Project → Settings → Environment Variables
      const contentType = guessContentType(ext);
      const blob = await put(key, buffer, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN, // if not set, put() will error
        contentType,
        addRandomSuffix: false,
      });
      storedUrl = blob.url; // e.g. https://<bucket>.public.blob.vercel-storage.com/uploads/123.pdf
      console.log("[upload] stored to Blob:", storedUrl);
    } else {
      // Local dev: write to public/uploads
      const absDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(absDir, { recursive: true });
      await fs.writeFile(path.join(absDir, filename), buffer);
      storedUrl = `/uploads/${filename}`; // relative path; fileUrl() will prefix when needed
      console.log("[upload] stored locally:", storedUrl);
    }

    // ---------- EXTRACT TEXT & RUN AI ----------
    let text = "";
    try {
      text = await extractTextFromBuffer(buffer, originalName, { allowOCR: true, ocrPages: 5, ocrDPI: 300 });
    } catch (e: any) {
      console.warn("[upload] extractTextFromBuffer threw:", e?.message);
    }
    const textLen = text?.trim()?.length ?? 0;
    console.log("[upload] extracted chars:", textLen);

    const profile = await prisma.companyProfile.findUnique({
      where: { clerkUserId: userId },
      select: { companyName: true },
    });
    const myCompanyName = profile?.companyName ?? null;

    const aiReasons: string[] = [];
    if (!process.env.OPENAI_API_KEY) aiReasons.push("no_openai_key");
    if (textLen < 10) aiReasons.push("no_or_too_little_text");
    const canUseAI = aiReasons.length === 0;

    let aiSummary: string | null = null;
    let meta: any = null;

    if (canUseAI) {
      try {
        aiSummary = await summarizeContract(text);
        console.log("[upload] summary chars:", aiSummary?.length ?? 0);
      } catch (e: any) {
        aiReasons.push(`summarize_error:${e?.message || "unknown"}`);
        console.warn("[upload] summarize failed:", e?.message);
      }
      try {
        meta = await extractContractMeta(text, { myCompanyName });
        console.log("[upload] meta keys:", meta && typeof meta === "object" ? Object.keys(meta) : null);
      } catch (e: any) {
        aiReasons.push(`meta_error:${e?.message || "unknown"}`);
        console.warn("[upload] meta failed:", e?.message);
      }
    } else {
      console.warn("[upload] Skipping AI. reasons:", aiReasons);
    }

    // ---------- SAVE UPLOAD & PATCH CONTRACT ----------
    const createdUpload = await prisma.upload.create({
      data: {
        contractId,
        clerkUserId: userId,
        originalName,
        url: storedUrl, // <-- IMPORTANT: blob URL in prod, /uploads/... in dev
        bytes: buffer.length,
        aiSummary: aiSummary ?? null,
      },
      select: { id: true },
    });

    if (override || !contract.currentUploadId) {
      await prisma.contract.update({
        where: { id: contractId },
        data: { currentUploadId: createdUpload.id },
      });
    }

    const patch: Record<string, any> = {};
    if (meta && typeof meta === "object") {
      if (isStr(meta.contractTitle)) patch.title = meta.contractTitle;

      const provider = normalizeCo(meta.provider);
      const customer = normalizeCo(meta.customer);
      const mine = normalizeCo(myCompanyName);
      if (provider || customer) {
        if (mine && provider && isSameCompany(provider, mine)) patch.counterparty = meta.customer || null;
        else if (mine && customer && isSameCompany(customer, mine)) patch.counterparty = meta.provider || null;
        else patch.counterparty = meta.customer || meta.provider || null;
      }

      setISODateIfValid(patch, "startDate", meta.startDateISO);
      setISODateIfValid(patch, "endDate", meta.endDateISO);
      setISODateIfValid(patch, "renewalDate", meta.renewalDateISO);

      if (isFiniteNum(meta.termLengthMonths)) patch.termLengthMonths = Number(meta.termLengthMonths);
      if (isFiniteNum(meta.renewalNoticeDays)) patch.renewalNoticeDays = Number(meta.renewalNoticeDays);
      if (typeof meta.autoRenew === "boolean") patch.autoRenew = meta.autoRenew;

      let monthly = safeNum(meta.monthlyFee);
      let annual = safeNum(meta.annualFee);
      if (monthly == null && annual != null) monthly = annual / 12;
      if (annual == null && monthly != null) annual = monthly * 12;
      if (monthly != null) patch.monthlyFee = round2(monthly);
      if (annual != null) patch.annualFee = round2(annual);
      if (isFiniteNum(meta.lateFeePct)) patch.lateFeePct = Number(meta.lateFeePct);

      if (isStr(meta.billingCadence)) patch.billingCadence = String(meta.billingCadence).toUpperCase();
      if (isStr(meta.paymentCadence)) patch.paymentCadence = String(meta.paymentCadence).toUpperCase();

      if (Array.isArray(meta.unusualClauses)) patch.unusualClauses = meta.unusualClauses;
      if (Array.isArray(meta.terminationRights)) patch.terminationRights = meta.terminationRights;
    }

    if (patch.autoRenew === true && !patch.renewalDate) {
      if (patch.endDate) patch.renewalDate = patch.endDate;
      else if (patch.startDate && patch.termLengthMonths) patch.renewalDate = addMonths(patch.startDate, Number(patch.termLengthMonths));
    }

    if (!patch.title && aiSummary) {
      const m = aiSummary.match(/Contract Title:\s*(.+)/i);
      if (m) patch.title = m[1].trim().replace(/[•\-–]+$/, "");
    }
    if (patch.monthlyFee == null && aiSummary) {
      const m = aiSummary.match(/Monthly Fee:\s*\$?([\d,]+(?:\.\d+)?)/i);
      if (m) patch.monthlyFee = round2(Number(m[1].replace(/,/g, "")));
    }

    if (Object.keys(patch).length) {
      await prisma.contract.update({ where: { id: contractId }, data: patch });
    }

    return NextResponse.json({
      ok: true,
      id: createdUpload.id,
      contractId,
      url: storedUrl,
      aiSummary,
      meta: meta ?? null,
      extractedChars: textLen,
      aiUsed: canUseAI,
      aiReasons,
    });
  } catch (e: any) {
    console.error("[/api/upload] fatal:", e?.message || e);
    return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
  }
}

/* ------------ helpers ------------- */
function safeExt(name: string) {
  const m = (name || "").toLowerCase().match(/\.(pdf|docx?|txt)$/i);
  return m ? m[0] : "";
}
function guessContentType(ext: string) {
  if (!ext) return "application/octet-stream";
  if (/\.pdf$/i.test(ext)) return "application/pdf";
  if (/\.docx?$/i.test(ext)) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (/\.txt$/i.test(ext)) return "text/plain";
  return "application/octet-stream";
}
function randomId(n = 8) {
  const a = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < n; i++) s += a[(Math.random() * a.length) | 0];
  return s;
}
function setISODateIfValid(obj: Record<string, any>, key: string, iso?: string | null) {
  if (!iso || typeof iso !== "string") return;
  const dt = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (!isNaN(dt.getTime())) obj[key] = dt;
}
function isFiniteNum(v: any): v is number { const n = Number(v); return Number.isFinite(n); }
function safeNum(v: any) { const n = Number(v); return Number.isFinite(n) ? n : null; }
function isStr(v: any): v is string { return typeof v === "string" && v.trim().length > 0; }
function round2(n: number) { return Math.round(n * 100) / 100; }
function normalizeCo(v?: string | null) {
  if (!v) return "";
  return v
    .toLowerCase()
    .replace(/[.,']/g, " ")
    .replace(/\b(incorporated|inc|llc|l\.l\.c|corp|corporation|co|company|ltd|limited)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function isSameCompany(a: string, b: string) { if (!a || !b) return false; return a === b || a.includes(b) || b.includes(a); }
function addMonths(d: Date, m: number) { const dt = new Date(d); dt.setMonth(dt.getMonth() + m); return dt; }
