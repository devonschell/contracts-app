import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";
import { extractTextFromBuffer } from "@/lib/extractText";
import { summarizeContract, extractContractMeta } from "@/lib/ai";

export const runtime = "nodejs"; // <-- IMPORTANT: pdf-parse/mammoth need Node

export const maxUploadSize = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const form = await req.formData();
    const file =
      (form.get("file") as File | null) ||
      (form.get("files") as File | null) ||
      (form.get("upload") as File | null) ||
      null;

    if (!(file instanceof File)) {
      console.error("[ingest] No file. Keys:", Array.from(form.keys()));
      return NextResponse.json({ ok: false, error: "No file provided." }, { status: 400 });
    }
    if (file.size > maxUploadSize) {
      return NextResponse.json({ ok: false, error: "File too large" }, { status: 413 });
    }

    const originalName = (file as any).name || "upload";
    const ext = safeExt(originalName);
    const filename = `${Date.now()}-${rand(8)}${ext}`;
    const relPath = `/uploads/${filename}`;
    const absDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(absDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(absDir, filename), buffer);

    // Create an empty contract first (like before)
    const created = await prisma.contract.create({
      data: {
        clerkUserId: userId,
        title: originalName.replace(/\.(pdf|docx?|txt)$/i, ""),
        counterparty: null,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    const contractId = created.id;
    console.log("[ingest] created contract", contractId);

    // ---- Extract text (Node-only libs)
    const text = await extractTextFromBuffer(buffer, originalName);
    console.log("[ingest] extracted chars:", text.length, "openai?", !!process.env.OPENAI_API_KEY);

    // Identify “my company” to help AI pick counterparty
    const profile = await prisma.companyProfile.findUnique({
      where: { clerkUserId: userId },
      select: { companyName: true },
    });
    const myCompanyName = profile?.companyName ?? null;

    // ---- Run AI if we have text + key
    let aiSummary: string | null = null;
    let meta: any = null;
    if (text && text.trim().length >= 50 && process.env.OPENAI_API_KEY) {
      try {
        aiSummary = await summarizeContract(text);
        console.log("[ingest] summary len:", aiSummary.length);
      } catch (e: any) {
        console.warn("[ingest] summarize failed:", e?.message || e);
      }
      try {
        meta = await extractContractMeta(text, { myCompanyName });
        console.log("[ingest] meta keys:", meta ? Object.keys(meta) : null);
      } catch (e: any) {
        console.warn("[ingest] meta failed:", e?.message || e);
      }
    } else {
      console.warn("[ingest] AI skipped (no text or no OPENAI_API_KEY)");
    }

    // ---- Save upload (history) and set current
    const createdUpload = await prisma.upload.create({
      data: {
        contractId,
        clerkUserId: userId,
        originalName,
        url: relPath,
        bytes: buffer.length,
        aiSummary: aiSummary ?? null,
      },
      select: { id: true },
    });

    await prisma.contract.update({
      where: { id: contractId },
      data: { currentUploadId: createdUpload.id },
    });

    // ---- Auto-fill contract fields from meta
    const patch: Record<string, any> = {};
    if (meta && typeof meta === "object") {
      if (isStr(meta.contractTitle)) patch.title = meta.contractTitle;

      // counterparty (pick the "other" party vs myCompany)
      const provider = normalizeCo(meta.provider);
      const customer = normalizeCo(meta.customer);
      const mine = normalizeCo(myCompanyName);
      if (provider || customer) {
        if (mine && provider && isSameCompany(provider, mine)) patch.counterparty = meta.customer || null;
        else if (mine && customer && isSameCompany(customer, mine)) patch.counterparty = meta.provider || null;
        else patch.counterparty = meta.customer || meta.provider || null;
      }

      setISO(patch, "startDate", meta.startDateISO);
      setISO(patch, "endDate", meta.endDateISO);
      setISO(patch, "renewalDate", meta.renewalDateISO);

      if (isNum(meta.termLengthMonths)) patch.termLengthMonths = +meta.termLengthMonths;
      if (isNum(meta.renewalNoticeDays)) patch.renewalNoticeDays = +meta.renewalNoticeDays;
      if (typeof meta.autoRenew === "boolean") patch.autoRenew = meta.autoRenew;

      let monthly = toNum(meta.monthlyFee);
      let annual = toNum(meta.annualFee);
      if (monthly == null && annual != null) monthly = annual / 12;
      if (annual == null && monthly != null) annual = monthly * 12;
      if (monthly != null) patch.monthlyFee = round2(monthly);
      if (annual != null) patch.annualFee = round2(annual);
      if (isNum(meta.lateFeePct)) patch.lateFeePct = +meta.lateFeePct;

      if (isStr(meta.billingCadence)) patch.billingCadence = String(meta.billingCadence).toUpperCase();
      if (isStr(meta.paymentCadence)) patch.paymentCadence = String(meta.paymentCadence).toUpperCase();
    }

    if (Object.keys(patch).length) {
      await prisma.contract.update({ where: { id: contractId }, data: patch });
      console.log("[ingest] contract updated from meta");
    } else {
      console.log("[ingest] no meta to apply");
    }

    return NextResponse.json({ ok: true, contractId });
  } catch (e: any) {
    console.error("[/api/ingest] fatal:", e?.message || e);
    return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
  }
}

/* ------------ helpers ------------- */
function safeExt(name: string) {
  const m = (name || "").toLowerCase().match(/\.(pdf|docx?|txt)$/i);
  return m ? m[0] : "";
}
function rand(n = 8) {
  const a = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < n; i++) s += a[(Math.random() * a.length) | 0];
  return s;
}
function isStr(v: any): v is string { return typeof v === "string" && v.trim().length > 0; }
function isNum(v: any): v is number { return Number.isFinite(Number(v)); }
function toNum(v: any) { const n = Number(v); return Number.isFinite(n) ? n : null; }
function round2(n: number) { return Math.round(n * 100) / 100; }
function setISO(obj: any, key: string, iso?: string | null) {
  if (!iso || typeof iso !== "string") return;
  const dt = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (!isNaN(dt.getTime())) obj[key] = dt;
}
function normalizeCo(v?: string | null) {
  if (!v) return "";
  return v
    .toLowerCase()
    .replace(/[.,']/g, " ")
    .replace(/\b(incorporated|inc|llc|l\.l\.c|corp|corporation|co|company|ltd|limited)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function isSameCompany(a: string, b: string) {
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}
