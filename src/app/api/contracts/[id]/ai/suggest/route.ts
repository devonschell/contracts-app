import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";
import { extractTextFromBuffer } from "@/lib/extractText";
import { summarizeContract, extractContractMeta } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  // Find contract + current upload for this user
  const contract = await prisma.contract.findFirst({
    where: { id, clerkUserId: userId, deletedAt: null },
    include: { currentUpload: true },
  });
  if (!contract) return NextResponse.json({ ok: false, error: "Contract not found" }, { status: 404 });
  if (!contract.currentUpload?.url) {
    return NextResponse.json({ ok: false, error: "No current file to analyze" }, { status: 400 });
  }

  // Read the file from /public
  const absPath = path.join(process.cwd(), "public", contract.currentUpload.url.replace(/^\/+/, ""));
  let buffer: Buffer;
  try {
    buffer = await fs.readFile(absPath);
  } catch {
    return NextResponse.json({ ok: false, error: "Could not read file" }, { status: 500 });
  }

  // Pull raw text
  const originalName = contract.currentUpload.originalName || "upload";
  const text = await extractTextFromBuffer(buffer, originalName);
  const textLen = text?.length ?? 0;
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ ok: false, error: "OPENAI_API_KEY not set" }, { status: 400 });
  }
  if (!text || text.trim().length < 50) {
    return NextResponse.json({ ok: false, error: "File has little/no extractable text" }, { status: 400, extractedChars: textLen });
  }

  // Identify "my company" to infer the counterparty
  const profile = await prisma.companyProfile.findUnique({
    where: { clerkUserId: userId },
    select: { companyName: true },
  });
  const myCompanyName = profile?.companyName ?? null;

  // Run AI
  let aiSummary: string | null = null;
  let meta: any = null;
  try {
    aiSummary = await summarizeContract(text);
  } catch (e) {
    console.warn("[ai/suggest] summarize failed:", (e as Error).message);
  }
  try {
    meta = await extractContractMeta(text, { myCompanyName });
  } catch (e) {
    console.warn("[ai/suggest] extract meta failed:", (e as Error).message);
  }

  // Save summary on the current upload
  if (aiSummary) {
    await prisma.upload.update({
      where: { id: contract.currentUpload.id },
      data: { aiSummary },
    });
  }

  // Auto-fill contract fields
  const data: Record<string, any> = {};
  if (meta && typeof meta === "object") {
    if (isStr(meta.contractTitle)) data.title = meta.contractTitle;

    const provider = normalizeCo(meta.provider);
    const customer = normalizeCo(meta.customer);
    const mine = normalizeCo(myCompanyName);
    if (provider || customer) {
      if (mine && provider && isSameCompany(provider, mine)) data.counterparty = meta.customer || null;
      else if (mine && customer && isSameCompany(customer, mine)) data.counterparty = meta.provider || null;
      else data.counterparty = meta.customer || meta.provider || null;
    }

    setISODateIfValid(data, "startDate", meta.startDateISO);
    setISODateIfValid(data, "endDate", meta.endDateISO);
    setISODateIfValid(data, "renewalDate", meta.renewalDateISO);

    if (isFiniteNum(meta.termLengthMonths)) data.termLengthMonths = Number(meta.termLengthMonths);
    if (isFiniteNum(meta.renewalNoticeDays)) data.renewalNoticeDays = Number(meta.renewalNoticeDays);
    if (typeof meta.autoRenew === "boolean") data.autoRenew = meta.autoRenew;

    let monthly = safeNum(meta.monthlyFee);
    let annual = safeNum(meta.annualFee);
    if (monthly == null && annual != null) monthly = annual / 12;
    if (annual == null && monthly != null) annual = monthly * 12;
    if (monthly != null) data.monthlyFee = round2(monthly);
    if (annual != null) data.annualFee = round2(annual);
    if (isFiniteNum(meta.lateFeePct)) data.lateFeePct = Number(meta.lateFeePct);

    if (isStr(meta.billingCadence)) data.billingCadence = String(meta.billingCadence).toUpperCase();
    if (isStr(meta.paymentCadence)) data.paymentCadence = String(meta.paymentCadence).toUpperCase();

    if (Array.isArray(meta.unusualClauses)) data.unusualClauses = meta.unusualClauses;
    if (Array.isArray(meta.terminationRights)) data.terminationRights = meta.terminationRights;
  }

  // Small fallbacks from summary text
  if (!data.title && aiSummary) {
    const m = aiSummary.match(/Contract Title:\s*(.+)/i);
    if (m) data.title = m[1].trim().replace(/[•\-–]+$/, "");
  }
  if (data.monthlyFee == null && aiSummary) {
    const m = aiSummary.match(/Monthly Fee:\s*\$?([\d,]+(?:\.\d+)?)/i);
    if (m) data.monthlyFee = round2(Number(m[1].replace(/,/g, "")));
  }

  if (Object.keys(data).length) {
    await prisma.contract.update({ where: { id: contract.id }, data });
  }

  return NextResponse.json({
    ok: true,
    extractedChars: textLen,
    savedSummary: !!aiSummary,
    savedFields: Object.keys(data),
  });
}

/* helpers */
function setISODateIfValid(obj: Record<string, any>, key: string, iso?: string | null) {
  if (!iso || typeof iso !== "string") return;
  const dt = new Date(iso.length === 10 ? iso + "T00:00:00Z" : iso);
  if (!isNaN(dt.getTime())) obj[key] = dt;
}
function isFiniteNum(v: any): v is number {
  const n = Number(v);
  return Number.isFinite(n);
}
function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function isStr(v: any): v is string {
  return typeof v === "string" && v.trim().length > 0;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function normalizeCo(v?: string | null) {
  if (!v) return "";
  return v
    .toLowerCase()
    .replace(/[.,']/g, " ")
    .replace(/\b(incorporated|inc|l\.l\.c|llc|corp|corporation|co|company|ltd|limited)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function isSameCompany(a: string, b: string) {
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}
