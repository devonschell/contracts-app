import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function sodUTC(d=new Date()){ return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }
function addDays(d: Date, n: number){ const x=sodUTC(d); x.setUTCDate(x.getUTCDate()+n); return x; }

async function main() {
  const email = (process.argv[2] || "").trim();
  if (!email) throw new Error("Usage: npx tsx scripts/force-today.ts <recipientEmail>");

  const company = await prisma.companyProfile.findFirst({
    select: { id:true, clerkUserId:true },
    orderBy: { createdAt: "asc" },
  });
  if (!company) throw new Error("No CompanyProfile found. Open Settings → Profile and Save once.");

  // Ensure NotificationPrefs is set
  await prisma.notificationPrefs.upsert({
    where: { companyId: company.id },
    update: {
      recipientsCsv: email,
      renewalAlerts: true,
      weeklyDigest: true,
      noticeDays: 30,
    },
    create: {
      companyId: company.id,
      recipientsCsv: email,
      renewalAlerts: true,
      weeklyDigest: true,
      noticeDays: 30,
    },
  });

  const today = sodUTC(new Date());
  const tomorrow = new Date(today.getTime() + 86_400_000);

  const daysList = [1,3,7];
  const prepared: { id: string; title: string; days: number }[] = [];

  for (const d of daysList) {
    const title = `Force Daily ${d}d`;
    const renewalDate = addDays(today, d);

    const existing = await prisma.contract.findFirst({
      where: { clerkUserId: company.clerkUserId, title },
      select: { id: true },
    });

    let id: string;
    if (existing?.id) {
      const upd = await prisma.contract.update({
        where: { id: existing.id },
        data: { renewalDate, deletedAt: null, status: "ACTIVE", monthlyFee: 199, counterparty: "Acme Co." },
        select: { id: true },
      });
      id = upd.id;
    } else {
      const created = await prisma.contract.create({
        data: {
          clerkUserId: company.clerkUserId,
          title,
          counterparty: "Acme Co.",
          status: "ACTIVE",
          renewalDate,
          monthlyFee: 199,
        },
        select: { id: true },
      });
      id = created.id;
    }

    // clear today's idempotency so cron can send now
    await prisma.notificationLog.deleteMany({
      where: { companyId: company.id, contractId: id, type: "RENEWAL_ALERT", sentAt: { gte: today, lt: tomorrow } },
    });

    prepared.push({ id, title, days: d });
  }

  console.log(`✅ Recipients set to ${email}`);
  console.log(`✅ Prepared ${prepared.length} contracts:`, prepared.map(p => `${p.title}`).join(", "));
}
main().finally(()=>prisma.$disconnect());
