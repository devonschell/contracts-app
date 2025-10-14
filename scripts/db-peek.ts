import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function sodUTC(d=new Date()){ return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }

async function main() {
  const today = sodUTC(new Date());
  const tomorrow = new Date(today.getTime() + 86_400_000);

  const [
    contractsCount,
    uploadsCount,
    profilesCount,
    prefsCount,
    logsCount,
    todaysLogsCount,
  ] = await Promise.all([
    prisma.contract.count(),
    prisma.upload.count(),
    prisma.companyProfile.count(),
    prisma.notificationPrefs.count(),
    prisma.notificationLog.count(),
    prisma.notificationLog.count({ where: { sentAt: { gte: today, lt: tomorrow } } }),
  ]);

  console.log("=== DB Summary ===");
  console.table([
    { table: "Contract", count: contractsCount },
    { table: "Upload", count: uploadsCount },
    { table: "CompanyProfile", count: profilesCount },
    { table: "NotificationPrefs", count: prefsCount },
    { table: "NotificationLog (total)", count: logsCount },
    { table: "NotificationLog (today)", count: todaysLogsCount },
  ]);

  // Recent logs
  const recent = await prisma.notificationLog.findMany({
    orderBy: { sentAt: "desc" },
    take: 25,
    select: {
      sentAt: true, type: true, status: true, subject: true,
      sentTo: true, error: true, contractId: true, companyId: true,
    },
  });

  console.log("\n=== Recent NotificationLog (latest 25) ===");
  console.table(
    recent.map(r => ({
      sentAt: r.sentAt.toISOString(),
      type: r.type,
      status: r.status,
      subject: r.subject?.slice(0, 60),
      to: r.sentTo?.slice(0, 40),
      contractId: r.contractId,
      companyId: r.companyId,
      error: r.error?.slice(0, 50) || "",
    }))
  );

  // Optional: show upcoming contracts in 90 days for the first company
  const firstCompany = await prisma.companyProfile.findFirst({ select: { id: true, clerkUserId: true, companyName: true } });
  if (firstCompany) {
    const in90 = new Date(today.getTime() + 90 * 86_400_000);
    const upcoming = await prisma.contract.findMany({
      where: {
        clerkUserId: firstCompany.clerkUserId,
        deletedAt: null,
        renewalDate: { gte: today, lte: in90 },
      },
      select: { id: true, title: true, counterparty: true, renewalDate: true },
      orderBy: { renewalDate: "asc" },
      take: 15,
    });
    console.log(`\n=== Upcoming (≤90d) for company: ${firstCompany.companyName || firstCompany.id} ===`);
    console.table(upcoming.map(c => ({
      id: c.id,
      title: c.title,
      counterparty: c.counterparty || "-",
      renewalDate: c.renewalDate?.toISOString().slice(0,10),
    })));
  }
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
