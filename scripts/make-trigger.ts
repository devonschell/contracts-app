import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function startOfUTCDay(d=new Date()){return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));}
function addDays(d: Date, n: number){const x=startOfUTCDay(d); x.setUTCDate(x.getUTCDate()+n); return x;}

async function main(){
  const days = Number(process.argv[2] ?? "1");
  if (!Number.isFinite(days)) throw new Error("Usage: npx tsx scripts/make-trigger.ts <days>");

  // pick first company
  const company = await prisma.companyProfile.findFirst({
    select: { id:true, clerkUserId:true },
    orderBy: { createdAt: "asc" },
  });
  if (!company) throw new Error("No CompanyProfile. Open Settings → Profile and Save once.");

  const title = `Trigger ${days}d`;
  // upsert a contract
  const today = startOfUTCDay(new Date());
  const renewal = addDays(today, days);
  const c = await prisma.contract.upsert({
    where: { // unique by (clerkUserId, title) emulated
      id: (await (async () => {
        const found = await prisma.contract.findFirst({
          where: { clerkUserId: company.clerkUserId, title },
          select: { id: true },
        });
        return found?.id ?? "___notfound___";
      })()) as any
    },
    update: { renewalDate: renewal, deletedAt: null, status: "ACTIVE" },
    create: {
      clerkUserId: company.clerkUserId,
      title,
      counterparty: "Acme Co.",
      status: "ACTIVE",
      renewalDate: renewal,
      monthlyFee: 199,
    },
    select: { id:true },
  }).catch(async () => {
    // fallback: create if upsert failed due to bogus where.id
    return prisma.contract.create({
      data: {
        clerkUserId: company.clerkUserId,
        title,
        counterparty: "Acme Co.",
        status: "ACTIVE",
        renewalDate: renewal,
        monthlyFee: 199,
      },
      select: { id:true },
    });
  });

  // clear today's idempotency log for this contract so we can resend
  const todayUTC = startOfUTCDay(new Date());
  const tomorrow = new Date(todayUTC.getTime() + 86_400_000);
  await prisma.notificationLog.deleteMany({
    where: { companyId: company.id, contractId: c.id, type: "RENEWAL_ALERT", sentAt: { gte: todayUTC, lt: tomorrow } },
  });

  console.log(`✅ Prepared contract ${c.id} at ${days}d out`);
}
main().finally(()=>prisma.$disconnect());
