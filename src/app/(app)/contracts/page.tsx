import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import NewContractButton from "@/components/NewContractButton";
import ContractsTable, { ContractRow, LatestUpload } from "@/components/ContractsTable";

export const dynamic = "force-dynamic";

export default async function ContractsPage(props: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return <div className="p-6">Please sign in.</div>;

  const { tab } = await props.searchParams;
  const mode: "active" | "deleted" = (tab ?? "active") === "deleted" ? "deleted" : "active";

  const where =
    mode === "deleted"
      ? { clerkUserId: userId, deletedAt: { not: null } }
      : { clerkUserId: userId, deletedAt: null };

  const contracts = await prisma.contract.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    take: 200,
    include: {
      currentUpload: true,
      uploads: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const rows: ContractRow[] = contracts.map((c) => {
    const latest = (c.currentUpload ?? c.uploads[0]) as any;
    const latestUpload: LatestUpload | undefined = latest
      ? {
          id: latest.id,
          url: latest.url,
          originalName: latest.originalName,
          createdAt: latest.createdAt,
        }
      : undefined;

    return {
      id: c.id,
      counterparty: c.counterparty,
      title: c.title ?? latestUpload?.originalName ?? "Untitled Contract",
      status: (c.status as any) ?? "ACTIVE",
      renewalDate: c.renewalDate,
      renewalNoticeDays: c.renewalNoticeDays,
      autoRenew: c.autoRenew,
      latestUpload,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header row: title + segmented tabs, and New button on the right */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Contracts</h1>

          {/* Segmented tabs */}
          <div className="inline-flex rounded-md border bg-white p-0.5">
            <a
              href="/contracts?tab=active"
              aria-current={mode === "active" ? "page" : undefined}
              className={`px-3 py-1.5 text-sm rounded-md transition
                ${mode === "active"
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"}`}
            >
              Active
            </a>
            <a
              href="/contracts?tab=deleted"
              aria-current={mode === "deleted" ? "page" : undefined}
              className={`px-3 py-1.5 text-sm rounded-md transition
                ${mode === "deleted"
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"}`}
            >
              Deleted
            </a>
          </div>
        </div>

        <NewContractButton />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white">
        <ContractsTable rows={rows} mode={mode} />
      </div>
    </div>
  );
}
