"use client";

import { useEffect, useMemo, useState } from "react";

type CommonProps = {
  contractId: string;
  field: string;
  label?: string;
  className?: string;
};

type Props =
  | (CommonProps & {
      type?: "text" | "number" | "date";
      value: string | number | null | undefined;
    })
  | (CommonProps & {
      type: "select";
      value: string | null | undefined;
      options: { label: string; value: string }[];
    })
  | (CommonProps & { type: "boolean"; value: boolean | null | undefined });

export default function InlineField(props: Props) {
  const { contractId, field, className } = props;

  const initial = useMemo(
    () =>
      props.type === "boolean"
        ? Boolean(props.value)
        : props.type === "date"
        ? toDateInputValue(props.value)
        : props.value ?? "",
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.type, JSON.stringify(props.value)]
  );

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [val, setVal] = useState<any>(initial);

  useEffect(() => {
    // keep local state in sync if parent value changes
    setVal(initial);
  }, [initial]);

  const start = () => setEditing(true);
  const cancel = () => {
    setVal(initial);
    setEditing(false);
  };

  const save = async () => {
    setBusy(true);
    try {
      const body: any = {};
      if (props.type === "date") {
        // val is "YYYY-MM-DD" or ""
        body[field] = val ? new Date(val as string).toISOString() : null;
      } else if (props.type === "number") {
        body[field] = val === "" ? null : Number(val);
      } else if (props.type === "boolean") {
        body[field] = Boolean(val);
      } else if (props.type === "select") {
        body[field] = val ?? null;
      } else {
        body[field] = val === "" ? null : val;
      }

      const res = await fetch(`/api/contracts/${contractId}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || res.statusText);
      window.location.reload();
    } catch (e: any) {
      alert(e?.message || "Save failed");
    } finally {
      setBusy(false);
      setEditing(false);
    }
  };

  // Display value formatting (read mode)
  const display =
    props.type === "boolean"
      ? props.value === true
        ? "Yes"
        : props.value === false
        ? "No"
        : "—"
      : props.type === "date"
      ? props.value
        ? new Date(props.value as any).toLocaleDateString()
        : "—"
      : props.value === null || props.value === undefined || props.value === ""
      ? "—"
      : String(props.value);

  // keyboard helpers for inputs
  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  return (
    <div className={className}>
      {!editing ? (
        <div className="group flex items-center gap-2">
          <span className="text-sm text-slate-900">{display}</span>
          <button
            type="button"
            onClick={start}
            className="invisible cursor-pointer rounded p-1 text-slate-500 hover:bg-slate-100 group-hover:visible"
            aria-label="Edit"
            title="Edit"
          >
            ✎
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {props.type === "select" ? (
            <select
              value={(val as string) ?? ""}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={onKeyDown}
              className="rounded border px-2 py-1 text-sm"
            >
              {(props.options ?? []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : props.type === "boolean" ? (
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(val)}
                onChange={(e) => setVal(e.target.checked)}
              />
              {val ? "Yes" : "No"}
            </label>
          ) : (
            <input
              type={props.type ?? "text"}
              value={val as any}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={onKeyDown}
              className={`rounded border px-2 py-1 text-sm ${
                props.type === "number" ? "w-48" : "w-40"
              }`}
            />
          )}

          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="rounded bg-black px-2 py-1 text-xs font-medium text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={cancel}
            className="rounded border px-2 py-1 text-xs"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- utils ---------- */
function toDateInputValue(v: unknown): string {
  if (!v) return "";
  const dt = typeof v === "string" ? new Date(v) : (v as Date);
  if (isNaN(dt.getTime())) return "";
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
