import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import Link from "next/link";
import ReplaceUploadButton from "@/components/ReplaceUploadButton";
import InlineField from "@/components/InlineField";
import AiPanel from "./AiPanel";
import PageContainer from "@/components/PageContainer";
import DeleteContractButton from "@/components/DeleteContractButton";

export const dynamic = "force-dynamic";

export default async function ContractDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return <div className="p-6">Please sign in.</div>;

  const { id } = await params;

  const c = await prisma.contract.findFirst({
    where: { id, clerkUserId: userId },
    include: {
      currentUpload: {
        select: { id: true, originalName: true, url: true, aiSummary: true },
      },
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
    <PageContainer
      title={c.title || c.currentUpload?.originalName || "Untitled Contract"}
      description="Contract Intelligence Overview"
    >
      {/* Header Section */}
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            Counterparty: {c.counterparty || "Unknown"}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <StatusPill status={c.status as any} />
            {isDeleted && (
              <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                Deleted
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/contracts" className="btn-secondary text-sm">
            ← Back to Contracts
          </Link>
          {!isDeleted && <DeleteContractButton contractId={c.id} />}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Details */}
          <Card title="Details">
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <Labeled label="Counterparty">
                <InlineField
                  type="text"
                  contractId={c.id}
                  field="counterparty"
                  value={c.counterparty ?? ""}
                />
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
                <InlineField
                  type="date"
                  contractId={c.id}
                  field="startDate"
                  value={c.startDate as any}
                />
              </Labeled>
              <Labeled label="End date">
                <InlineField
                  type="date"
                  contractId={c.id}
                  field="endDate"
                  value={c.endDate as any}
                />
              </Labeled>

              <Labeled label="Renewal date">
                <InlineField
                  type="date"
                  contractId={c.id}
                  field="renewalDate"
                  value={c.renewalDate as any}
                />
              </Labeled>
              <Labeled label="Auto-renew">
                <InlineField
                  type="boolean"
                  contractId={c.id}
                  field="autoRenew"
                  value={c.autoRenew ?? false}
                />
              </Labeled>

              <Labeled label="Monthly fee">
                <InlineField
                  type="number"
                  contractId={c.id}
                  field="monthlyFee"
                  value={c.monthlyFee as any}
                />
              </Labeled>
              <Labeled label="Annual fee">
                <InlineField
                  type="number"
                  contractId={c.id}
                  field="annualFee"
                  value={c.annualFee as any}
                />
              </Labeled>

              <Labeled label="Late fee %">
                <InlineField
                  type="number"
                  contractId={c.id}
                  field="lateFeePct"
                  value={c.lateFeePct as any}
                />
              </Labeled>
              <Labeled label="Notice days">
                <InlineField
                  type="number"
                  contractId={c.id}
                  field="renewalNoticeDays"
                  value={c.renewalNoticeDays as any}
                />
              </Labeled>

              <Labeled label="Term (months)">
                <InlineField
                  type="number"
                  contractId={c.id}
                  field="termLengthMonths"
                  value={c.termLengthMonths as any}
                />
              </Labeled>
              <Labeled label="Billing cadence">
                <InlineField
                  type="text"
                  contractId={c.id}
                  field="billingCadence"
                  value={c.billingCadence ?? ""}
                />
              </Labeled>
              <Labeled label="Payment cadence">
                <InlineField
                  type="text"
                  contractId={c.id}
                  field="paymentCadence"
                  value={c.paymentCadence ?? ""}
                />
              </Labeled>
            </div>

            <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
              <span className="mr-2 font-medium text-foreground">
                Action required by:
              </span>
              {actionRequiredDate
                ? actionRequiredDate.toLocaleDateString()
                : "—"}
              <span className="ml-2 text-muted-foreground">
                ({c.renewalNoticeDays ?? 30}d before renewal)
              </span>
            </div>
          </Card>

          {/* Fees */}
          {(c.monthlyFee != null ||
            c.annualFee != null ||
            c.paymentCadence) && (
            <Card title="Fees">
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
                <FeeItem label="Monthly" value={money(c.monthlyFee)} />
                <FeeItem label="Annual" value={money(c.annualFee)} />
                <FeeItem
                  label="Payment cadence"
                  value={c.paymentCadence || "—"}
                />
              </div>
            </Card>
          )}

          {/* Clauses */}
          {(unusualClauses.length > 0 || terminationRights.length > 0) && (
            <Card title="Clauses">
              <div className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-2">
                <ClauseList title="Unusual Clauses" items={unusualClauses} />
                <ClauseList title="Termination Rights" items={terminationRights} />
              </div>
            </Card>
          )}

          {/* AI Summary */}
          <AiPanel
            contractId={c.id}
            aiSummary={c.currentUpload?.aiSummary ?? null}
            currentName={c.currentUpload?.originalName ?? null}
          />

          {/* Current file */}
          <Card title="Current file">
            <div className="flex items-center justify-between p-2">
              <div className="text-sm text-foreground">
                {c.currentUpload
                  ? c.currentUpload.originalName
                  : "No file yet"}
              </div>
              <div className="flex gap-2">
                {c.currentUpload && (
                  <a
                    href={c.currentUpload.url}
                    download
                    className="btn-secondary text-sm"
                  >
                    Download
                  </a>
                )}
                {!isDeleted && <ReplaceUploadButton contractId={c.id} />}
              </div>
            </div>
          </Card>

          {/* Upload history */}
          <Card title="Upload history">
            <div className="divide-y divide-border">
              {c.uploads.length === 0 ? (
                <div className="px-4 py-4 text-sm text-muted-foreground">
                  No uploads yet.
                </div>
              ) : (
                c.uploads.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <div className="text-sm text-foreground">
                        {u.originalName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {fmtDateTime(u.createdAt)}
                      </div>
                    </div>
                    <a href={u.url} download className="btn-tertiary text-xs">
                      Download
                    </a>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

/* ---- Subcomponents ---- */
function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: "ACTIVE" | "REVIEW" | "TERMINATED" }) {
  const cls =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "REVIEW"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function FeeItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm text-foreground">{value || "—"}</div>
    </div>
  );
}

function ClauseList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      {items.length === 0 ? (
        <div className="mt-1 text-sm text-muted-foreground">—</div>
      ) : (
        <ul className="mt-2 list-disc pl-5 text-sm text-foreground space-y-1">
          {items.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function fmtDateTime(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return isNaN(dt.getTime()) ? "" : dt.toLocaleString();
}

function money(v?: number | null) {
  if (v == null || isNaN(Number(v))) return "—";
  return `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
