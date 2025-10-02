"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type Opt = { label: string; value: string };

type Props = {
  contractId: string;
  field:
    | "counterparty" | "title" | "status"
    | "startDate" | "endDate" | "renewalDate"
    | "monthlyFee" | "annualFee" | "lateFeePct"
    | "renewalNoticeDays" | "termLengthMonths"
    | "autoRenew" | "billingCadence" | "paymentCadence";
  type: "text" | "number" | "date" | "boolean" | "select";
  value: any;
  options?: Opt[];
};

export default function InlineField({ contractId, field, type, value, options }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // keep a local draft in the UI-friendly format
  const [draft, setDraft] = useState<any>(() => {
    if (type === "date") {
      const d = toDate(value);
      return d ? d.toISOString().slice(0, 10) : "";           // YYYY-MM-DD
    }
    if (type === "boolean") return !!value;
    if (value == null) return "";
    return String(value);
  });

  // re-initialize draft when value changes externally (after refresh)
  useMemo(() => {
    if (!editing) {
      if (type === "date") {
        const d = toDate(value);
        setDraft(d ? d.toISOString().slice(0, 10) : "");
      } else if (type === "boolean") {
        setDraft(!!value);
      } else {
        setDraft(value == null ? "" : String(value));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  async function onSave() {
    setSaving(true);
    try {
      // send UI value, let the API coerce/validate
      const payload =
        type === "boolean"
          ? { field, value: !!draft }
          : type === "date"
          ? { field, value: draft || "" }           // "YYYY-MM-DD" or ""
          : type === "number"
          ? { field, value: String(draft) }         // allow "2,500" etc; API cleans it
          : { field, value: draft };

      const res = await fetch(`/api/contracts/${contractId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || res.statusText || "Update failed");
      }

      setEditing(false);
      router.refresh(); // pick up the new value from the server
    } catch (e: any) {
      alert(e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-2">
        <span>{formatDisplay(type, value)}</span>
        <button
          type="button"
          aria-label="Edit"
          title="Edit"
          className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-slate-100 text-slate-600"
          onClick={() => setEditing(true)}
        >
          {/* tiny pencil */}
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M13.5 2.5l4 4L7 17H3v-4L13.5 2.5z" stroke="currentColor" />
          </svg>
        </button>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {type === "text" && (
        <input
          className="w-48 rounded border px-2 py-1 text-sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      )}
      {type === "number" && (
        <input
          className="w-32 rounded border px-2 py-1 text-sm"
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. 2,500"
        />
      )}
      {type === "date" && (
        <input
          type="date"
          className="rounded border px-2 py-1 text-sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      )}
      {type === "boolean" && (
        <select
          className="rounded border px-2 py-1 text-sm"
          value={draft ? "true" : "false"}
          onChange={(e) => setDraft(e.target.value === "true")}
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      )}
      {type === "select" && (
        <select
          className="rounded border px-2 py-1 text-sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        >
          {(options || []).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-xs text-slate-600 underline underline-offset-2"
      >
        Cancel
      </button>
    </div>
  );
}

/* ---------- helpers ---------- */

function toDate(v: any): Date | null {
  if (!v) return null;
  const d = typeof v === "string" ? new Date(v) : v;
  return Number.isNaN(d?.getTime?.()) ? null : d;
}

function formatDisplay(type: Props["type"], v: any) {
  if (v == null || v === "") return "—";
  if (type === "date") {
    const d = toDate(v);
    return d ? d.toLocaleDateString() : "—";
  }
  if (type === "boolean") return v ? "Yes" : "No";
  if (type === "number") {
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString() : String(v);
  }
  return String(v);
}
