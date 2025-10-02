import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

/* ---------- auth helpers ---------- */
function hasBypass(req: NextRequest) {
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return false;
  const h = (req.headers.get("x-cron-secret") || "").trim();
  const q = (new URL(req.url).searchParams.get("key") || "").trim();
  return h === secret || q === secret;
}

/* ---------- field buckets ---------- */
const DATE_FIELDS = new Set(["startDate","endDate","renewalDate"]);
const INT_FIELDS  = new Set(["renewalNoticeDays","termLengthMonths"]);
const NUM_FIELDS  = new Set(["monthlyFee","annualFee","lateFeePct"]);
const BOOL_FIELDS = new Set(["autoRenew"]);
const STR_FIELDS  = new Set(["title","counterparty","billingCadence","paymentCadence"]);
const STATUS_ENUM = new Set(["ACTIVE","REVIEW","TERMINATED"]);

/* ---------- parsers ---------- */
function parseDateFlexible(v: any): { value: Date|null, invalid: boolean } {
  if (v == null || v === "") return { value: null, invalid: false };
  const s = String(v).trim();

  // mm/dd/yyyy
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const [, m, d, y] = mdy;
    const dt = new Date(Date.UTC(+y, +m - 1, +d));
    return isNaN(dt.valueOf()) ? { value: null, invalid: true } : { value: dt, invalid: false };
  }

  // yyyy-mm-dd
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    const [, y, m, d] = ymd;
    const dt = new Date(Date.UTC(+y, +m - 1, +d));
    return isNaN(dt.valueOf()) ? { value: null, invalid: true } : { value: dt, invalid: false };
  }

  // last resort
  const dt = new Date(s);
  if (isNaN(dt.valueOf())) return { value: null, invalid: true };
  const utcOnly = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
  return { value: utcOnly, invalid: false };
}

function toNumberBase(v: any): number|null {
  if (v == null || v === "") return null;
  const s = String(v).replace(/[\$,]/g, "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const parseIntField   = (v: any) => {
  const n = toNumberBase(v);
  return n == null ? { value: null, invalid: false } :
    Number.isFinite(n) ? { value: Math.round(n), invalid: false } : { value: null, invalid: true };
};

const parseFloatField = (v: any) => {
  const n = toNumberBase(v);
  return n == null ? { value: null, invalid: false } :
    Number.isFinite(n) ? { value: Math.round(n * 100) / 100, invalid: false } : { value: null, invalid: true };
};

function parseBool(v: any): { value: boolean|null, invalid: boolean } {
  if (v == null || v === "") return { value: null, invalid: false };
  if (typeof v === "boolean") return { value: v, invalid: false };
  const s = String(v).toLowerCase().trim();
  if (["true","1","yes","on"].includes(s))  return { value: true, invalid: false };
  if (["false","0","no","off"].includes(s)) return { value: false, invalid: false };
  return { value: null, invalid: true };
}

/* ---------- payload readers ---------- */
async function readPayload(req: NextRequest) {
  const ct = (req.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) {
    return await req.json().catch(() => ({}));
  }
  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    if (!form) return {};
    const obj: Record<string, any> = {};
    for (const [k, v] of form.entries()) obj[k] = v as any;
    if (obj.field !== undefined && obj.value !== undefined) return { field: obj.field, value: obj.value };
    return obj;
  }
  return await req.json().catch(() => ({}));
}

/* ---------- coercion with validation ---------- */
function coercePatch(input: Record<string, any>) {
  const patch: Record<string, any> = {};
  const errors: string[] = [];

  for (const [k, raw] of Object.entries(input)) {
    if (DATE_FIELDS.has(k)) {
      const { value, invalid } = parseDateFlexible(raw);
      if (invalid) errors.push(`${k}: invalid date`);
      else patch[k] = value; // may be null to clear
    } else if (INT_FIELDS.has(k)) {
      const { value, invalid } = parseIntField(raw);
      if (invalid) errors.push(`${k}: invalid number`);
      else patch[k] = value;
    } else if (NUM_FIELDS.has(k)) {
      const { value, invalid } = parseFloatField(raw);
      if (invalid) errors.push(`${k}: invalid number`);
      else patch[k] = value;
    } else if (BOOL_FIELDS.has(k)) {
      const { value, invalid } = parseBool(raw);
      if (invalid) errors.push(`${k}: invalid boolean`);
      else patch[k] = value;
    } else if (STR_FIELDS.has(k)) {
      const s = (raw == null ? "" : String(raw)).trim();
      patch[k] = s === "" ? null : s;
    } else if (k === "status") {
      const up = String(raw || "").toUpperCase().trim();
      if (!STATUS_ENUM.has(up)) errors.push(`${k}: invalid status`);
      else patch[k] = up;
    }
  }

  return { patch, errors };
}

/* ---------- unified handler ---------- */
async function handleUpdate(req: NextRequest, idFromParams?: string) {
  const bypass = hasBypass(req);

  let userId: string | null = null;
  if (!bypass) {
    const a = await auth();
    userId = a.userId ?? null;
    if (!userId) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status:401 });
  }

  const body = await readPayload(req);
  const id = idFromParams || (body?.id as string);
  if (!id) return NextResponse.json({ ok:false, error:"Missing id" }, { status:400 });

  // translate {field,value} to an object
  let rawPatch: Record<string, any> = {};
  if (body && typeof body === "object") {
    if ("field" in body) rawPatch = { [String((body as any).field)]: (body as any).value };
    else if (body.patch && typeof body.patch === "object") rawPatch = body.patch as Record<string, any>;
    else rawPatch = body as Record<string, any>;
  }

  const { patch, errors } = coercePatch(rawPatch);
  if (errors.length) {
    return NextResponse.json({ ok:false, error: errors.join("; ") }, { status:400 });
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok:false, error:"No valid fields to update" }, { status:400 });
  }

  const guardWhere: any = bypass ? { id } : { id, clerkUserId: userId, deletedAt: null };
  const exists = await prisma.contract.findFirst({ where: guardWhere, select: { id: true } });
  if (!exists) return NextResponse.json({ ok:false, error:"Not found" }, { status:404 });

  try {
    const updated = await prisma.contract.update({
      where: { id },
      data: patch,
      select: {
        id: true, title: true, counterparty: true, status: true,
        startDate: true, endDate: true, renewalDate: true,
        autoRenew: true, monthlyFee: true, annualFee: true,
        lateFeePct: true, renewalNoticeDays: true, termLengthMonths: true,
        billingCadence: true, paymentCadence: true, updatedAt: true,
      },
    });
    return NextResponse.json({ ok:true, data: updated });
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    console.error("[contracts update] prisma error:", e);
    return NextResponse.json({ ok:false, error: msg }, { status:500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: { id?: string } }) { return handleUpdate(req, ctx?.params?.id); }
export async function POST (req: NextRequest, ctx: { params: { id?: string } }) { return handleUpdate(req, ctx?.params?.id); }
export async function PUT  (req: NextRequest, ctx: { params: { id?: string } }) { return handleUpdate(req, ctx?.params?.id); }
