import "server-only";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/notify";
import { diffDaysUTC, startOfUTCDay } from "@/lib/date";
import { formatMoney } from "@/lib/money";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    if (!checkCronAuth(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const base = new URL(req.url).origin;
    const today = startOfUTCDay(new Date());
    const tomorrow = new Date(today.getTime() + 86_400_000);

    const companies = await prisma.companyProfile.findMany({
      select: {
        id: true,
        clerkUserId: true,
        renewalLeadDaysDefault: true,
        currency: true,
        notificationPrefs: true,
      },
    });

    let sent = 0, skipped = 0, errors = 0;

    for (const c of companies) {
      const prefs = c.notificationPrefs ?? null;
      const recipientsCsv = prefs?.recipientsCsv ?? "";
      const recipients = recipientsCsv.split(",").map(s => s.trim()).filter(Boolean);
      const sendAlerts = (prefs?.renewalAlerts ?? true) && recipients.length > 0;
      if (!sendAlerts) { skipped++; continue; }

      const cutoff = new Date(today.getTime() + 90 * 86_400_000);
      const contracts = await prisma.contract.findMany({
        where: { clerkUserId: c.clerkUserId, deletedAt: null, renewalDate: { lte: cutoff } },
        select: {
          id: true, title: true, counterparty: true, renewalDate: true,
          renewalNoticeDays: true, monthlyFee: true, annualFee: true,
        },
        orderBy: { renewalDate: "asc" },
      });

      for (const k of contracts) {
        if (!k.renewalDate) continue;

        const defaultLead = c.renewalLeadDaysDefault ?? 30;
        const useNoticeDays =
          typeof k.renewalNoticeDays === "number"
            ? k.renewalNoticeDays
            : (prefs?.noticeDays ?? defaultLead);

        if (diffDaysUTC(k.renewalDate, today) !== useNoticeDays) continue;

        // Idempotency by sentAt (today)
        const already = await prisma.notificationLog.findFirst({
          where: {
            companyId: c.id,
            contractId: k.id,
            type: "RENEWAL_ALERT",
            sentAt: { gte: today, lt: tomorrow },
            status: { in: ["SENT", "ERROR"] },
          },
          select: { id: true },
        });
        if (already) { skipped++; continue; }

        const amountNum =
          typeof k.annualFee === "number" ? k.annualFee :
          typeof k.monthlyFee === "number" ? k.monthlyFee : null;
        const amount = formatMoney(amountNum, c.currency ?? "USD", "en-US", 0);
        const link = `${base}/contracts/${k.id}`;
        const dateISO = new Date(k.renewalDate).toISOString().slice(0,10);
        const days = diffDaysUTC(k.renewalDate, today);

        const table = `
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#111827;">
  <p style="margin:0 0 12px 0;">Heads up — this contract renews in <b>${days}</b> days.</p>
  <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;font-size:14px;">
    <thead>
      <tr>
        <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;background:#f8fafc;">Title</th>
        <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;background:#f8fafc;">Counterparty</th>
        <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;background:#f8fafc;">Renewal date</th>
        <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;background:#f8fafc;">Amount</th>
        <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;background:#f8fafc;">Days</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding:8px;border:1px solid #e5e7eb;"><a href="${link}" style="color:#111827;text-decoration:none;"><b>${k.title || "Untitled"}</b></a></td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${k.counterparty || "-"}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${dateISO}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${amount}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${days}</td>
      </tr>
    </tbody>
  </table>
  <p style="margin-top:14px;">
    <a href="${link}" style="display:inline-block;padding:10px 14px;border-radius:10px;border:1px solid #e5e7eb;text-decoration:none;">Open contract</a>
  </p>
</div>`.trim();

        const subject = `Renewal in ${useNoticeDays} days: ${k.title || "(Untitled)"}${k.counterparty ? " · " + k.counterparty : ""}`;

        try {
          await sendEmail({ to: recipients, subject, html: table });
          await prisma.notificationLog.create({
            data: {
              companyId: c.id,
              contractId: k.id,
              type: "RENEWAL_ALERT",
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
              contractId: k.id,
              type: "RENEWAL_ALERT",
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
    }

    return NextResponse.json({ ok: true, sent, skipped, errors, ranAt: today.toISOString().slice(0,10) });
  } catch (e: any) {
    console.error("[daily-renewals] fatal:", e);
    return NextResponse.json({ ok:false, error:String(e?.message ?? e) }, { status:500 });
  }
}
