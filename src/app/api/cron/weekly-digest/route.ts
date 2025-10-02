import "server-only";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/notify";
import { formatMoney } from "@/lib/money";
import { diffDaysUTC, startOfUTCDay } from "@/lib/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Auth via header or ?key=...
function checkCronAuth(req: Request) {
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return false;
  const h = (req.headers.get("x-cron-secret") || "").trim();
  const url = new URL(req.url);
  const q = (url.searchParams.get("key") || "").trim();
  return h === secret || q === secret;
}

export async function GET(req: Request) {
  try {
    if (!checkCronAuth(req)) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status:401 });

    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1"; // test mid-week
    const base = url.origin;

    const today = startOfUTCDay(new Date());
    const tomorrow = new Date(today.getTime() + 86_400_000);
    const isMondayUTC = today.getUTCDay() === 1;

    // Only bypass the Monday check with force; DO NOT bypass idempotency
    if (!isMondayUTC && !force) {
      return NextResponse.json({ ok:true, sent:0, skipped:1, errors:0, reason:"not_monday" });
    }

    const in60 = new Date(today.getTime() + 60 * 86_400_000);

    const companies = await prisma.companyProfile.findMany({
      select: {
        id: true,
        clerkUserId: true,
        companyName: true,
        currency: true,
        timezone: true,
        notificationPrefs: true,
      },
    });

    let sent = 0, skipped = 0, errors = 0;

    for (const c of companies) {
      const prefs = c.notificationPrefs ?? {};
      const recipients = String(prefs.recipientsCsv ?? "")
        .split(",").map(s => s.trim()).filter(Boolean);
      const enabled = (prefs.weeklyDigest ?? true) && recipients.length > 0;
      if (!enabled) { skipped++; continue; }

      // Idempotency: skip if already sent/attempted today (by sentAt)
      const already = await prisma.notificationLog.findFirst({
        where: {
          companyId: c.id,
          type: "WEEKLY_DIGEST",
          sentAt: { gte: today, lt: tomorrow },
          status: { in: ["SENT", "ERROR"] },
        },
        select: { id: true },
      });
      if (already) { skipped++; continue; }

      // Collect contracts due next 60 days
      const contracts = await prisma.contract.findMany({
        where: {
          clerkUserId: c.clerkUserId,
          deletedAt: null,
          renewalDate: { gte: today, lte: in60 },
        },
        select: {
          id: true, title: true, counterparty: true, renewalDate: true,
          monthlyFee: true, annualFee: true,
        },
        orderBy: { renewalDate: "asc" },
      });

      // Bucket
      const dueThisWeek: typeof contracts = [];
      const in30: typeof contracts = [];
      const in60only: typeof contracts = [];
      for (const k of contracts) {
        const d = diffDaysUTC(k.renewalDate!, today);
        if (d <= 7) dueThisWeek.push(k);
        else if (d <= 30) in30.push(k);
        else in60only.push(k);
      }
      if (dueThisWeek.length + in30.length + in60only.length === 0) { skipped++; continue; }

      const currency = c.currency ?? "USD";
      const tableCSS = 'border-collapse:collapse;width:100%;font-size:14px;';
      const thCSS = 'text-align:left;padding:8px;border:1px solid #e5e7eb;background:#f8fafc;';
      const tdCSS = 'padding:8px;border:1px solid #e5e7eb;';

      const row = (k: typeof contracts[number]) => {
        const amtNum = typeof k.annualFee === "number" ? k.annualFee
                    : typeof k.monthlyFee === "number" ? k.monthlyFee
                    : null;
        const amt = formatMoney(amtNum, currency, "en-US", 0);
        const link = `${base}/contracts/${k.id}`;
        const dateISO = new Date(k.renewalDate!).toISOString().slice(0,10);
        const days = diffDaysUTC(k.renewalDate!, today);
        return `<tr>
  <td style="${tdCSS}"><a href="${link}" style="color:#111827;text-decoration:none;"><b>${k.title || "Untitled"}</b></a></td>
  <td style="${tdCSS}">${k.counterparty || "-"}</td>
  <td style="${tdCSS}">${dateISO}</td>
  <td style="${tdCSS}">${amt}</td>
  <td style="${tdCSS}">${days}</td>
</tr>`;
      };

      const section = (title: string, items: typeof contracts) =>
        !items.length ? "" : `
<h3 style="margin:18px 0 6px 0;font-size:14px;">${title}</h3>
<table role="presentation" cellspacing="0" cellpadding="0" style="${tableCSS}">
  <thead>
    <tr>
      <th style="${thCSS}">Title</th>
      <th style="${thCSS}">Counterparty</th>
      <th style="${thCSS}">Renewal date</th>
      <th style="${thCSS}">Amount</th>
      <th style="${thCSS}">Days</th>
    </tr>
  </thead>
  <tbody>
    ${items.map(row).join("")}
  </tbody>
</table>`.trim();

      const count = dueThisWeek.length + in30.length + in60only.length;
      const subject = `Weekly renewals digest — ${count} upcoming`;

      const html = `
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#111827;">
  <p style="margin:0 0 10px 0;"><b>Weekly renewals digest</b></p>
  ${section("Due this week (≤ 7 days)", dueThisWeek)}
  ${section("In 30 days (8–30)", in30)}
  ${section("In 60 days (31–60)", in60only)}
  <p style="margin-top:16px;">
    <a href="${base}/contracts" style="display:inline-block;padding:10px 14px;border-radius:10px;border:1px solid #e5e7eb;text-decoration:none;">Open contracts</a>
  </p>
</div>`.trim();

      try {
        await sendEmail({ to: recipients, subject, html });
        await prisma.notificationLog.create({
          data: {
            companyId: c.id,
            type: "WEEKLY_DIGEST",
            subject,
            sentTo: recipients.join(","),
            status: "SENT",
            sentAt: new Date(),
          },
        });
        sent++;
      } catch (e: any) {
        await prisma.notificationLog.create({
          data: {
            companyId: c.id,
            type: "WEEKLY_DIGEST",
            subject,
            sentTo: recipients.join(","),
            status: "ERROR",
            error: String(e?.message ?? e),
            sentAt: new Date(),
          },
        });
        errors++;
      }
    }

    return NextResponse.json({ ok:true, sent, skipped, errors, ranAt: today.toISOString().slice(0,10), forced: force });
  } catch (e: any) {
    console.error("[weekly-digest] fatal:", e);
    return NextResponse.json({ ok:false, error:String(e?.message ?? e) }, { status:500 });
  }
}
