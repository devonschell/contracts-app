import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const titleLike = [
    "Force Daily ",
    "Daily Test ",
    "Trigger ",
    "Test contract "
  ];

  const testContracts = await prisma.contract.findMany({
    where: { OR: titleLike.map(s => ({ title: { contains: s, mode: "insensitive" } })) },
    select: { id: true }
  });
  const ids = testContracts.map(c => c.id);
  if (!ids.length) { console.log("No test contracts matched."); return; }

  const delLogs    = await prisma.notificationLog.deleteMany({ where: { contractId: { in: ids } } });
  const delUploads = await prisma.upload.deleteMany({ where: { contractId: { in: ids } } });
  const delCons    = await prisma.contract.deleteMany({ where: { id: { in: ids } } });

  console.log(`��️ Deleted ${delCons.count} contracts, ${delUploads.count} uploads, ${delLogs.count} logs.`);
}
main().finally(()=>process.exit(0));
