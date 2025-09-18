import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import DeletedTable from "@/components/DeletedTable";

export const dynamic = "force-dynamic";

export default async function DeletedContractsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const deleted = await prisma.contract.findMany({
    where: { clerkUserId: userId, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    include: { uploads: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Deleted</h1>
      <DeletedTable contracts={deleted as any} />
    </div>
  );
}
