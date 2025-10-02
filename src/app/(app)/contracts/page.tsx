import "server-only";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import NewContractButton from "@/components/NewContractButton";
import ContractsTable, { ContractRow, LatestUpload } from "@/components/ContractsTable";

export const dynamic = "force-dynamic";

export default async function ContractsPage(props: {
  searchParams: Promise<{ tab?: string; q?: string; page?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return <div className="p-6">Please sign in.</div>;

  const { tab, q, page: pageStr } = await props.searchParams;

  const mode: "active" | "deleted" = (tab ?? "active") === "deleted" ? "deleted" : "active";
  const query = (q ?? "").trim();

  // Pagination
  const pageSize = 20;
  const page = Math.max(1, Number.parseInt(pageStr || "1", 10) || 1);
  const skip = (page - 1) * pageSize;

  // Filters
  const baseWhere =
    mode === "deleted"
      ? { clerkUserId: userId, deletedAt: { not: null } }
      : { clerkUserId: userId, deletedAt: null };

  const where = query
    ? {
        ...baseWhere,
        OR: [
          { title: { contains: query } },
          { counterparty: { contains: query } },
        ],
      }
    : baseWhere;

  // Query current page and total count
  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip,
      take: pageSize,
      include: {
        currentUpload: true,
        uploads: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.contract.count({ where }),
  ]);

  // Map to table rows
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

  // Paging helpers
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const makeHref = (p: number, tabMode = mode) => {
    const params = new URLSearchParams();
    params.set("tab", tabMode);
    if (query) params.set("q", query);
    params.set("page", String(p));
    return `/contracts?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header row: title + segmented tabs + search; New button on the right */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <h1 className="text-2xl font-semibold">Contracts</h1>

          {/* Segmented tabs */}
          <div className="inline-flex rounded-md border bg-white p-0.5">
            <a
              href={makeHref(1, "active")}
              aria-current={mode === "active" ? "page" : undefined}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                mode === "active" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Active
            </a>
            <a
              href={makeHref(1, "deleted")}
              aria-current={mode === "deleted" ? "page" : undefined}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                mode === "deleted" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Deleted
            </a>
          </div>

          {/* Search */}
          <form method="get" className="flex items-center gap-2">
            <input type="hidden" name="tab" value={mode} />
            <input type="hidden" name="page" value="1" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search title or counterparty"
              className="w-64 rounded-md border px-3 py-1.5 text-sm"
            />
            {query ? (
              <a
                href={`/contracts?tab=${mode}&page=1`}
                className="text-sm text-slate-600 underline underline-offset-4"
              >
                Clear
              </a>
            ) : null}
          </form>
        </div>

        <NewContractButton />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white">
        <ContractsTable rows={rows} mode={mode} />
      </div>

      {/* Pager */}
      <div className="flex items-center justify-between text-sm text-slate-600">
        <div>
          Showing <b>{rows.length}</b> of <b>{total}</b> • Page <b>{page}</b> / <b>{totalPages}</b>
        </div>
        <div className="inline-flex items-center gap-2">
          <a
            href={page > 1 ? makeHref(page - 1) : "#"}
            aria-disabled={page === 1}
            className={`rounded-md border px-3 py-1.5 ${page === 1 ? "pointer-events-none opacity-50" : "hover:bg-slate-50"}`}
          >
            ← Previous
          </a>
          <a
            href={page < totalPages ? makeHref(page + 1) : "#"}
            aria-disabled={page === totalPages}
            className={`rounded-md border px-3 py-1.5 ${page === totalPages ? "pointer-events-none opacity-50" : "hover:bg-slate-50"}`}
          >
            Next →
          </a>
        </div>
      </div>
    </div>
  );
}
