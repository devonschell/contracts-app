import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function addDays(d: Date, n: number) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

async function main() {
  const email = process.argv[2] || process.env.SEED_EMAIL || "you@example.com";
  const clerkUserIdArg = process.argv[3] || process.env.SEED_CLERK_USER_ID || null;

  // Pick company
  let company = null as null | { id: string; clerkUserId: string; currency: string | null };
  if (clerkUserIdArg) {
    company = await prisma.companyProfile.findUnique({
      where: { clerkUserId: clerkUserIdArg },
      select: { id: true, clerkUserId: true, currency: true },
    });
    if (!company) {
      throw new Error(`No CompanyProfile found for clerkUserId=${clerkUserIdArg}. Visit Settings once to create it.`);
    }
  } else {
    company = await prisma.companyProfile.findFirst({
      select: { id: true, clerkUserId: true, currency: true },
      orderBy: { createdAt: "asc" },
    });
    if (!company) {
      throw new Error("No CompanyProfile found. Open your app, go to Settings → Profile, and Save once.");
    }
  }

  // Upsert NotificationPrefs
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

  // Sample contracts at specific day offsets
  const todayUTC = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  const offsets = [
    30, 15, 7, 5, 3, 2, 1, // daily triggers
    45, 75                   // for weekly digest buckets (31–60 and 61–90)
  ];

  const existing = await prisma.contract.findMany({
    where: { clerkUserId: company!.clerkUserId },
    select: { id: true, title: true }
  });
  const haveTitle = new Set(existing.map(e => e.title || ""));

  for (const d of offsets) {
    const title = `Test contract ${d}d`;
    if (haveTitle.has(title)) continue;
    await prisma.contract.create({
      data: {
        clerkUserId: company!.clerkUserId,
        title,
        counterparty: "Acme Co.",
        status: "ACTIVE",
        renewalDate: addDays(todayUTC, d),
        monthlyFee: 199,
        renewalNoticeDays: null, // use prefs (30) unless you set a contract-specific override
      },
    });
  }

  console.log(`✅ Seeded NotificationPrefs to ${email} and ensured ${offsets.length} test contracts exist for clerkUserId=${company!.clerkUserId}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
