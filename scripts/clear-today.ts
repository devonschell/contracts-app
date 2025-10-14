import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function sodUTC(d=new Date()){ return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }

async function main() {
  const today = sodUTC(new Date());
  const tomorrow = new Date(today.getTime() + 86_400_000);

  // Clear today's logs so daily cron can send again right now
  const res = await prisma.notificationLog.deleteMany({
    where: { sentAt: { gte: today, lt: tomorrow } }
  });

  console.log(`🧹 Cleared ${res.count} NotificationLog rows for today.`);
}
main().finally(()=>prisma.$disconnect());
