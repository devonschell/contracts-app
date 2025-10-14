import "server-only";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmailWithRetry } from "@/lib/notify";
import { formatMoney } from "@/lib/money";
import { startOfUTCDay, diffDaysUTC } from "@/lib/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authed(req: Request) {
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return false;
  const u = new URL(req.url);
  const h = (req.headers.get("x-cron-secret") || "").trim();
  const q = (u.searchParams.get("key") || "").trim();
  const auth = (req.headers.get("authorization") || "").trim();
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  return h === secret || q === secret || bearer === secret;
}

export async function GET(req: Request) {
  if (!authed(req)) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status:401 });

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";
  const today = startOfUTCDay(new Date());
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const isMondayUTC = today.getUTCDay() === 1;
  if (!isMondayUTC && !force) return NextResponse.json({ ok:true, sent:0, skipped:1, errors:0, reason:"not_monday" });

  const weekEnd = new Date(today.getTime() + 7 * 86_400_000);
  const base = url.origin;

  const companies = await prisma.companyProfile.findMany({
    select: { id:true, clerkUserId:true, companyName:true, currency:true, notificationPrefs:true },
  });

  type Row = { companyId:string; companyName:string; id:string; title:string; counterparty:string; dateISO:string; amount:string; days:number; };
  const byRecipient = new Map<string, Row[]>();
  const companiesByRecipient = new Map<string, Set<string>>();

  for (const c of companies) {
    const prefs = c.notificationPrefs ?? {};
    const recipients = String(prefs.recipientsCsv ?? "").split(",").map(s=>s.trim()).filter(Boolean);
    if (!recipients.length || (prefs.weeklyDigest === false)) continue;

    // idempotency per company/Monday
    const already = await prisma.notificationLog.findFirst({
      where: { companyId: c.id, type: "WEEKLY_DIGEST", sentAt: { gte: today, lt: tomorrow }, status: { in: ["SENT","ERROR"] } },
      select: { id:true },
    });
    if (already && !force) continue;

    const ks = await prisma.contract.findMany({
      where: {
        clerkUserId: c.clerkUserId,
        deletedAt: null,
        renewalDate: { gte: today, lt: weekEnd },
        status: { in: ["ACTIVE","REVIEW"] },
      },
      select: { id:true, title:true, counterparty:true, renewalDate:true, monthlyFee:true, annualFee:true },
      orderBy: { renewalDate: "asc" },
    });
    if (!ks.length) continue;

    const currency = c.currency ?? "USD";

    for (const k of ks) {
      const dateISO = new Date(k.renewalDate!).toISOString().slice(0,10);
      const days = diffDaysUTC(k.renewalDate!, today);
      const amtNum = typeof k.annualFee === "number" ? k.annualFee :
                     typeof k.monthlyFee === "number" ? k.monthlyFee : null;
      const amount = formatMoney(amtNum, currency, "en-US", 0);

      for (const r of recipients) {
        if (!byRecipient.has(r)) byRecipient.set(r, []);
        byRecipient.get(r)!.push({
          companyId: c.id,
          companyName: c.companyName || "—",
          id: k.id,
          title: k.title || "Untitled",
          counterparty: k.counterparty || "-",
          dateISO,
          amount,
          days,
        });
        if (!companiesByRecipient.has(r)) companiesByRecipient.set(r, new Set());
        companiesByRecipient.get(r)!.add(c.id);
      }
    }
  }

  // send one email per recipient
  let sent = 0, skipped = 0, errors = 0;
  const th = 'text-align:left;padding:8px;border:1px solid #e5e7eb;background:#f8fafc;';
  const td = 'padding:8px;border:1px solid #e5e7eb;';

  for (const [recipient, rows] of byRecipient.entries()) {
    if (!rows.length) { skipped++; continue; }
    rows.sort((a,b) => a.dateISO.localeCompare(b.dateISO) || a.companyName.localeCompare(b.companyName));

    const rowsHtml = rows.map(r => {
      const link = `${base}/contracts/${r.id}`;
      return `<tr>
  <td style="${td}">${r.companyName}</td>
  <td style="${td}"><a href="${link}" style="color:#111827;text-decoration:none;"><b>${r.title}</b></a></td>
  <td style="${td}">${r.counterparty}</td>
  <td style="${td}">${r.dateISO}</td>
  <td style="${td}">${r.amount}</td>
  <td style="${td}">${r.days}</td>
</tr>`;
    }).join("");

    const subject = `Weekly renewals — due this week (${rows.length})`;
    const html = `
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#111827;">
  <p style="margin:0 0 10px 0;"><b>Upcoming renewals this week</b></p>
  <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;font-size:14px;">
    <thead>
      <tr>
        <th style="${th}">Company</th>
        <th style="${th}">Title</th>
        <th style="${th}">Counterparty</th>
        <th style="${th}">Renewal date</th>
        <th style="${th}">Amount</th>
        <th style="${th}">Days</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
  <p style="margin-top:16px;">
    <a href="${base}/contracts" style="display:inline-block;padding:10px 14px;border-radius:10px;border:1px solid #e5e7eb;text-decoration:none;">Open contracts</a>
  </p>
</div>`.trim();

    try {
      await sendEmailWithRetry({ to: [recipient], subject, html });
      const companiesSet = companiesByRecipient.get(recipient)!;
      for (const companyId of companiesSet) {
        await prisma.notificationLog.create({
          data: { companyId, type: "WEEKLY_DIGEST", subject, sentTo: recipient, status: "SENT", sentAt: new Date() },
        });
      }
      sent++;
    } catch (e:any) {
      const companiesSet = companiesByRecipient.get(recipient)!;
      for (const companyId of companiesSet) {
        await prisma.notificationLog.create({
          data: { companyId, type: "WEEKLY_DIGEST", subject, sentTo: recipient, status: "ERROR", error: String(e?.message ?? e), sentAt: new Date() },
        });
      }
      errors++;
    }
  }

  return NextResponse.json({ ok:true, sent, skipped, errors, ranAt: today.toISOString().slice(0,10), forced: force });
}
