cat > src/app/api/contracts/[id]/route.ts <<'TS'
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const id = params.id;
  const body = await req.json().catch(() => ({} as any));

  // only allow specific keys
  const allowed: any = {};
  for (const k of [
    "counterparty", "title", "status",
    "startDate", "endDate", "renewalDate",
    "monthlyFee", "annualFee", "lateFeePct", "renewalNoticeDays", "termLengthMonths",
    "autoRenew", "billingCadence", "paymentCadence",
  ]) {
    if (k in body) allowed[k] = body[k];
  }

  // coerce dates from strings
  for (const key of ["startDate", "endDate", "renewalDate"] as const) {
    if (typeof allowed[key] === "string") {
      const d = new Date(allowed[key]);
      allowed[key] = isNaN(d.valueOf()) ? null : d;
    }
  }

  // guard: must belong to user and not be deleted
  const owned = await prisma.contract.findFirst({
    where: { id, clerkUserId: userId, deletedAt: null },
    select: { id: true },
  });
  if (!owned) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  await prisma.contract.update({ where: { id }, data: allowed });
  return NextResponse.json({ ok: true });
}
TS
