import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";
import { extractTextFromBuffer } from "@/lib/extractText";
import { summarizeContract, extractContractMeta } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(_req: NextRequest, ctx: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const id = ctx.params?.id;
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

  const c = await prisma.contract.findFirst({
    where: { id, clerkUserId: userId, deletedAt: null },
    include: { currentUpload: { select: { id: true, url: true, originalName: true } } },
  });
  if (!c) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  if (!c.currentUpload?.url) {
    return NextResponse.json({ ok: false, error: "No current file to analyze" }, { status: 400 });
  }

  // ---- read bytes from Blob (prod) or disk (dev) ----
  let buffer: Buffer;
  const fileUrl = c.currentUpload.url;

  try {
    if (/^https?:\/\//i.test(fileUrl)) {
      // Vercel Blob public URL
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const arr = new Uint8Array(await res.arrayBuffer());
      buffer = Buffer.from(arr);
    } else {
      // Local dev: /uploads/... under public/
      const rel = fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl;
      const abs = path.join(process.cwd(), "public", rel);
      buffer = await fs.readFile(abs);
    }
  } catch (e: any) {
    console.error("[suggest] read file failed:", e?.message || e);
    return NextResponse.json({ ok: false, error: "File not found" }, { status: 404 });
  }

  // ---- extract text & run AI ----
  const text = await extractTextFromBuffer(
    buffer,
    c.currentUpload.originalName || "file",
    { allowOCR: true, ocrPages: 5, ocrDPI: 300 }
  );
  const textLen = text?.trim().length ?? 0;
  console.log("[suggest] extracted chars:", textLen);
  if (textLen < 20) {
    return NextResponse.json({ ok: false, error: "Could not extract any text" }, { status: 200 });
  }

  const profile = await prisma.companyProfile.findUnique({
    where: { clerkUserId: userId },
    select: { companyName: true },
  });
  const myCompanyName = profile?.companyName ?? null;

  let aiSummary = "";
  let meta: any = null;
  try { aiSummary = await summarizeContract(text); }
  catch (e: any) { console.warn("[suggest] summarize failed:", e?.message); }
  try { meta = await extractContractMeta(text, { myCompanyName }); }
  catch (e: any) { console.warn("[suggest] meta failed:", e?.message); }

  // save summary to the upload record
  try {
    await prisma.upload.update({ where: { id: c.currentUpload.id }, data: { aiSummary } });
  } catch (e) {
    console.warn("[suggest] failed to save aiSummary:", (e as Error)?.message);
  }

  // ---- patch contract with extracted metadata ----
  const patch: Record<string, any> = {};

  const isStr = (v: any): v is string => typeof v === "string" && v.trim().length > 0;
  const isFiniteNum = (v: any): v is number => Number.isFinite(Number(v));
  const normalizeCo = (v?: string | null) =>
    (v || "")
      .toLowerCase()
      .replace(/[.,']/g, " ")
      .replace(/\b(incorporated|inc|llc|l\.l\.c|corp|corporation|co|company|ltd|limited)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const isSameCo = (a: string, b: string) => !!a && !!b && (a === b || a.includes(b) || b.includes(a));
  const setISODateIfValid = (obj: Record<string, any>, key: string, iso?: string | null) => {
    if (!iso || typeof iso !== "string") return;
    const dt = new Date(iso.length === 10 ? iso + "T00:00:00Z" : iso);
    if (!isNaN(dt.getTime())) obj[key] = dt;
  };

  if (meta && typeof meta === "object") {
    if (isStr(meta.contractTitle)) patch.title = meta.contractTitle;

    const provider = normalizeCo(meta.provider);
    const customer = normalizeCo(meta.customer);
    const mine = normalizeCo(myCompanyName);
    if (provider || customer) {
      if (mine && provider && isSameCo(provider, mine)) patch.counterparty = meta.customer || null;
      else if (mine && customer && isSameCo(customer, mine)) patch.counterparty = meta.provider || null;
      else patch.counterparty = meta.customer || meta.provider || null;
    }

    setISODateIfValid(patch, "startDate", meta.startDateISO);
    setISODateIfValid(patch, "endDate", meta.endDateISO);
    setISODateIfValid(patch, "renewalDate", meta.renewalDateISO);

    if (isFiniteNum(meta.termLengthMonths)) patch.termLengthMonths = Number(meta.termLengthMonths);
    if (isFiniteNum(meta.renewalNoticeDays)) patch.renewalNoticeDays = Number(meta.renewalNoticeDays);
    if (typeof meta.autoRenew === "boolean") patch.autoRenew = meta.autoRenew;

    let monthly = Number(meta.monthlyFee);
    let annual = Number(meta.annualFee);
    if (!Number.isFinite(monthly)) monthly = NaN;
    if (!Number.isFinite(annual)) annual = NaN;
    if (Number.isNaN(monthly) && Number.isFinite(annual)) monthly = annual / 12;
    if (Number.isNaN(annual) && Number.isFinite(monthly)) annual = monthly * 12;
    if (Number.isFinite(monthly)) patch.monthlyFee = Math.round(monthly * 100) / 100;
    if (Number.isFinite(annual)) patch.annualFee = Math.round(annual * 100) / 100;
    if (isFiniteNum(meta.lateFeePct)) patch.lateFeePct = Number(meta.lateFeePct);

    if (isStr(meta.billingCadence)) patch.billingCadence = String(meta.billingCadence).toUpperCase();
    if (isStr(meta.paymentCadence)) patch.paymentCadence = String(meta.paymentCadence).toUpperCase();

    if (Array.isArray(meta.unusualClauses)) patch.unusualClauses = meta.unusualClauses;
    if (Array.isArray(meta.terminationRights)) patch.terminationRights = meta.terminationRights;
  }

  if (Object.keys(patch).length) {
    try { await prisma.contract.update({ where: { id: c.id }, data: patch }); } catch {}
  }

  return NextResponse.json({ ok: true, aiSummary, meta, extractedChars: textLen });
}
