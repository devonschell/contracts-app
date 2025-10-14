import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function sod(d=new Date()){ return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }
function addDays(d: Date, n: number){ const x=sod(d); x.setUTCDate(x.getUTCDate()+n); return x; }

async function main() {
  const daysArg = (process.argv[2] ?? "7,3,1").trim();
  const daysList = daysArg.split(",").map(s => Number(s.trim())).filter(n => Number.isFinite(n));

  const company = await prisma.companyProfile.findFirst({
    select: { id: true, clerkUserId: true },
    orderBy: { createdAt: "asc" },
  });
  if (!company) throw new Error("No CompanyProfile found. Open Settings → Profile and Save once.");

  const today = sod(new Date());
  const tomorrow = new Date(today.getTime() + 86_400_000);

  const prepared: { id: string; title: string; days: number }[] = [];

  for (const d of daysList) {
    const title = `Daily Test ${d}d`;
    const renewalDate = addDays(today, d);

    const existing = await prisma.contract.findFirst({
      where: { clerkUserId: company.clerkUserId, title },
      select: { id: true },
    });

    let id: string;
    if (existing?.id) {
      const upd = await prisma.contract.update({
        where: { id: existing.id },
        data: { renewalDate, deletedAt: null, status: "ACTIVE" },
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

    // Clear today's idempotency log so we can re-send right now
    await prisma.notificationLog.deleteMany({
      where: {
        companyId: company.id,
        contractId: id,
        type: "RENEWAL_ALERT",
        sentAt: { gte: today, lt: tomorrow },
      },
    });

    prepared.push({ id, title, days: d });
  }

  console.log(`✅ Prepared ${prepared.length} contracts:`, prepared.map(p => `${p.title}`).join(", "));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
