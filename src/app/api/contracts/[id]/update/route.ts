import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const id = params.id;
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }

  // allow-list fields
  const allowed: Record<string, any> = {};
  const keys = [
    "counterparty",
    "title",
    "status",
    "renewalDate",
    "autoRenew",
    "monthlyFee",
    "lateFeePct",
    "renewalNoticeDays",
    "termLengthMonths",
  ] as const;

  for (const k of keys) if (k in body) allowed[k] = body[k];

  // coerce
  if ("renewalDate" in allowed) {
    if (!allowed.renewalDate) delete allowed.renewalDate;
    else {
      const dt = new Date(allowed.renewalDate);
      if (isNaN(dt.getTime())) delete allowed.renewalDate;
      else allowed.renewalDate = dt;
    }
  }
  for (const n of ["monthlyFee", "lateFeePct", "renewalNoticeDays", "termLengthMonths"] as const) {
    if (n in allowed) {
      if (allowed[n] === "" || allowed[n] === null) allowed[n] = null;
      else {
        const num = Number(allowed[n]);
        if (Number.isFinite(num)) allowed[n] = num;
        else delete allowed[n];
      }
    }
  }
  if ("autoRenew" in allowed) allowed["autoRenew"] = Boolean(allowed["autoRenew"]);

  try {
    await prisma.contract.update({
      where: { id, clerkUserId: userId },
      data: allowed,
      select: { id: true },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[/api/contracts/[id]/update] fail:", e?.message);
    return NextResponse.json({ ok: false, error: e?.message || "Update failed" }, { status: 400 });
  }
}
