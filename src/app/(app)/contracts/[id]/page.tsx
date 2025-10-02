// src/app/(app)/contracts/[id]/page.tsx
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import Link from "next/link";
import ReplaceUploadButton from "@/components/ReplaceUploadButton";
import ContractActions from "@/components/ContractActions";
import InlineField from "@/components/InlineField";
import AiPanel from "./AiPanel";

export const dynamic = "force-dynamic";

export default async function ContractDetail(props: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return <div className="p-6">Please sign in.</div>;

  const { id } = await props.params;

  const c = await prisma.contract.findFirst({
    where: { id, clerkUserId: userId },
    include: {
      currentUpload: { select: { id: true, originalName: true, url: true, aiSummary: true } },
      uploads: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!c) return <div className="p-6">Not found.</div>;
  const isDeleted = !!c.deletedAt;

  const toStrArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  const unusualClauses = toStrArray((c as any).unusualClauses);
  const terminationRights = toStrArray((c as any).terminationRights);

  const actionRequiredDate = (() => {
    if (!c.renewalDate) return null;
    const d = new Date(c.renewalDate);
    const days =
      typeof c.renewalNoticeDays === "number" && c.renewalNoticeDays > 0
        ? c.renewalNoticeDays
        : 30;
    d.setDate(d.getDate() - days);
    return d;
  })();

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">Contract Intelligence</div>
          <h1 className="mt-1 text-2xl font-semibold">
            {c.title || c.currentUpload?.originalName || "Untitled Contract"}
          </h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-slate-600">
            <span>Counterparty: {c.counterparty || "Unknown"}</span>
            <StatusPill status={c.status as "ACTIVE" | "REVIEW" | "TERMINATED"} />
            {isDeleted && (
              <span className="rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-amber-800">
                Deleted
              </span>
            )}
          </div>
        </div>
        <Link href="/contracts" className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50">
          ← Back to contracts
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          {/* Details (read-only rows with inline ✏️ edit) */}
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
              Details
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <Labeled label="Counterparty">
                <InlineField type="text" contractId={c.id} field="counterparty" value={c.counterparty ?? ""} />
              </Labeled>

              <Labeled label="Status">
                <InlineField
                  type="select"
                  contractId={c.id}
                  field="status"
                  value={c.status}
                  options={[
                    { label: "ACTIVE", value: "ACTIVE" },
                    { label: "REVIEW", value: "REVIEW" },
                    { label: "TERMINATED", value: "TERMINATED" },
                  ]}
                />
              </Labeled>

              <Labeled label="Start date">
                <InlineField type="date" contractId={c.id} field="startDate" value={c.startDate as any} />
              </Labeled>
              <Labeled label="End date">
                <InlineField type="date" contractId={c.id} field="endDate" value={c.endDate as any} />
              </Labeled>

              <Labeled label="Renewal date">
                <InlineField type="date" contractId={c.id} field="renewalDate" value={c.renewalDate as any} />
              </Labeled>
              <Labeled label="Auto-renew">
                <InlineField type="boolean" contractId={c.id} field="autoRenew" value={c.autoRenew ?? false} />
              </Labeled>

              <Labeled label="Monthly fee">
                <InlineField type="number" contractId={c.id} field="monthlyFee" value={c.monthlyFee as any} />
              </Labeled>
              <Labeled label="Annual fee">
                <InlineField type="number" contractId={c.id} field="annualFee" value={c.annualFee as any} />
              </Labeled>

              <Labeled label="Late fee %">
                <InlineField type="number" contractId={c.id} field="lateFeePct" value={c.lateFeePct as any} />
              </Labeled>
              <Labeled label="Notice days">
                <InlineField type="number" contractId={c.id} field="renewalNoticeDays" value={c.renewalNoticeDays as any} />
              </Labeled>

              <Labeled label="Term (months)">
                <InlineField type="number" contractId={c.id} field="termLengthMonths" value={c.termLengthMonths as any} />
              </Labeled>
              <Labeled label="Billing cadence">
                <InlineField type="text" contractId={c.id} field="billingCadence" value={c.billingCadence ?? ""} />
              </Labeled>
              <Labeled label="Payment cadence">
                <InlineField type="text" contractId={c.id} field="paymentCadence" value={c.paymentCadence ?? ""} />
              </Labeled>
            </div>

            <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-700">
              <span className="mr-2 font-medium">Action required by:</span>
              {actionRequiredDate ? actionRequiredDate.toLocaleDateString() : "—"}
              <span className="ml-2 text-slate-500">({c.renewalNoticeDays ?? 30}d before renewal)</span>
            </div>
          </div>

          {/* Fees summary */}
          {(c.monthlyFee != null || c.annualFee != null || c.paymentCadence) && (
            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">Fees</div>
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
                <FeeItem label="Monthly" value={money(c.monthlyFee)} />
                <FeeItem label="Annual" value={money(c.annualFee)} />
                <FeeItem label="Payment cadence" value={c.paymentCadence || "—"} />
              </div>
            </div>
          )}

          {/* Clauses */}
          {(unusualClauses.length > 0 || terminationRights.length > 0) && (
            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">Clauses</div>
              <div className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-2">
                <ClauseList title="Unusual Clauses" items={unusualClauses} />
                <ClauseList title="Termination Rights" items={terminationRights} />
              </div>
            </div>
          )}

          {/* AI Summary */}
          <AiPanel
            contractId={c.id}
            aiSummary={c.currentUpload?.aiSummary ?? null}
            currentName={c.currentUpload?.originalName ?? null}
          />

          {/* Current file */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-800">Current file</div>
                <div className="text-sm text-slate-600">
                  {c.currentUpload ? c.currentUpload.originalName : "No file yet"}
                </div>
              </div>
              <div className="flex gap-2">
                {c.currentUpload && (
                  <a href={c.currentUpload.url} download className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50">
                    Download
                  </a>
                )}
                {!isDeleted && <ReplaceUploadButton contractId={c.id} />}
              </div>
            </div>
          </div>

          {/* Upload history */}
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">Upload history</div>
            <div className="divide-y divide-slate-100">
              {c.uploads.length === 0 ? (
                <div className="px-4 py-4 text-sm text-slate-600">No uploads yet.</div>
              ) : (
                c.uploads.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-sm text-slate-900">{u.originalName}</div>
                      <div className="text-xs text-slate-500">{fmtDateTime(u.createdAt)}</div>
                    </div>
                    <a href={u.url} download className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50">
                      Download
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Side actions */}
        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 text-sm font-semibold text-slate-800">Actions</div>
            <ContractActions contractId={c.id} isDeleted={isDeleted} />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <div className="mb-1 font-semibold text-slate-800">Renewal status</div>
            {renderRenewalBadge(c.renewalDate, c.renewalNoticeDays ?? undefined)}
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---- helpers ---- */
function StatusPill({ status }: { status: "ACTIVE" | "REVIEW" | "TERMINATED" }) {
  const cls =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : status === "REVIEW"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-slate-100 text-slate-700 border-slate-300";
  return <span className={`rounded-full border px-2 py-0.5 text-xs ${cls}`}>{status}</span>;
}
function fmtDateTime(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return isNaN(dt.getTime()) ? "" : dt.toLocaleString();
}
function renderRenewalBadge(date: Date | string | null, noticeDays?: number) {
  if (!date) return <span className="text-slate-500">No renewal date set.</span>;
  const dt = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dt.getTime())) return <span className="text-slate-500">Invalid date.</span>;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dt.getTime() - today.getTime()) / 86400000);
  const windowDays = noticeDays && noticeDays > 0 ? noticeDays : 30;
  if (diffDays < 0) return <span className="text-red-700">Overdue • {dt.toLocaleDateString()}</span>;
  if (diffDays <= windowDays) return <span className="text-amber-700">Due in {diffDays}d • {dt.toLocaleDateString()}</span>;
  return <span className="text-slate-700">{dt.toLocaleDateString()}</span>;
}
function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
function FeeItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm text-slate-900">{value || "—"}</div>
    </div>
  );
}
function money(v?: number | null) {
  if (v == null || isNaN(Number(v))) return "—";
  return `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
function ClauseList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
      {items.length === 0 ? (
        <div className="mt-1 text-sm text-slate-500">—</div>
      ) : (
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-800 space-y-1">
          {items.map((s, i) => (<li key={i}>{s}</li>))}
        </ul>
      )}
    </div>
  );
}
