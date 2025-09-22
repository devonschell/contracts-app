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
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const id = ctx.params?.id;
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

  const c = await prisma.contract.findFirst({
    where: { id, clerkUserId: userId, deletedAt: null },
    include: { currentUpload: { select: { id: true, url: true, originalName: true } } },
  });
  if (!c) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  if (!c.currentUpload) return NextResponse.json({ ok: false, error: "No current file to analyze" }, { status: 400 });

  const rel = c.currentUpload.url.startsWith("/") ? c.currentUpload.url.slice(1) : c.currentUpload.url;
  const abs = path.join(process.cwd(), "public", rel);

  let buffer: Buffer;
  try { buffer = await fs.readFile(abs); }
  catch { return NextResponse.json({ ok: false, error: "File not found on disk" }, { status: 404 }); }

  const text = await extractTextFromBuffer(
    buffer,
    c.currentUpload.originalName || path.basename(abs),
    { allowOCR: true, ocrPages: 5, ocrDPI: 300 }
  );
  const textLen = text?.trim().length ?? 0;
  console.log("[suggest] extracted chars:", textLen);
  if (textLen < 20) {
    return NextResponse.json({ ok: false, error: "Could not extract any text" }, { status: 200 });
  }

  const profile = await prisma.companyProfile.findUnique({
    where: { clerkUserId: userId }, select: { companyName: true },
  });
  const myCompanyName = profile?.companyName ?? null;

  let aiSummary = "";
  let meta: any = null;
  try { aiSummary = await summarizeContract(text); } catch (e: any) { console.warn("[suggest] summarize failed:", e?.message); }
  try { meta = await extractContractMeta(text, { myCompanyName }); } catch (e: any) { console.warn("[suggest] meta failed:", e?.message); }

  await prisma.upload.update({ where: { id: c.currentUpload.id }, data: { aiSummary } });

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

  if (Object.keys(patch).length) { try { await prisma.contract.update({ where: { id: c.id }, data: patch }); } catch {} }

  return NextResponse.json({ ok: true, aiSummary, meta, extractedChars: textLen });
}

/* helpers */
function setISODateIfValid(obj: Record<string, any>, key: string, iso?: string | null) {
  if (!iso || typeof iso !== "string") return;
  const dt = new Date(iso.length === 10 ? iso + "T00:00:00Z" : iso);
  if (!isNaN(dt.getTime())) obj[key] = dt;
}
function isFiniteNum(v: any): v is number { const n = Number(v); return Number.isFinite(n); }
function safeNum(v: any) { const n = Number(v); return Number.isFinite(n) ? n : null; }
function isStr(v: any): v is string { return typeof v === "string" && v.trim().length > 0; }
function round2(n: number) { return Math.round(n * 100) / 100; }
function normalizeCo(v?: string | null) {
  if (!v) return "";
  return v.toLowerCase().replace(/[.,']/g, " ")
    .replace(/\b(incorporated|inc|llc|l\.l\.c|corp|corporation|co|company|ltd|limited)\b/g, "")
    .replace(/\s+/g, " ").trim();
}
function isSameCompany(a: string, b: string) { if (!a || !b) return false; return a === b || a.includes(b) || b.includes(a); }
