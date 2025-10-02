"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { saveContractField } from "@/lib/saveContractField";

type Props = {
  contractId: string;
  field: string;                  // e.g. "renewalDate", "monthlyFee", "autoRenew"
  type?: "text"|"date"|"number"|"money"|"boolean";
  value?: string | number | boolean | null;
  className?: string;
};

function toISODateInput(v?: any) {
  if (!v) return "";
  const s = typeof v === "string" ? v : new Date(v).toISOString();
  const m = String(s).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}
function moneyToDisplay(v: any) {
  if (v == null || v === "") return "";
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
function moneyToNumber(s: string) {
  const n = Number(s.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

export default function InlineCell({ contractId, field, type="text", value, className }: Props) {
  const [val, setVal] = useState<string>(() => {
    if (type === "date") return toISODateInput(value);
    if (type === "money") return moneyToDisplay(value);
    if (typeof value === "boolean") return value ? "true" : "false";
    return value == null ? "" : String(value);
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const lastSaved = useRef<string>(val);

  useEffect(() => {
    // keep in sync if parent refreshes data
    const next = type === "date" ? toISODateInput(value)
               : type === "money" ? moneyToDisplay(value)
               : typeof value === "boolean" ? (value ? "true" : "false")
               : value == null ? "" : String(value);
    setVal(next);
    lastSaved.current = next;
  }, [value, type]);

  const onBlur = async () => {
    if (val === lastSaved.current) return;
    setSaving(true); setErr(null);
    try {
      let outgoing: any = val;
      if (type === "date") {
        outgoing = val || ""; // server coerces "" -> null
      } else if (type === "number") {
        outgoing = val === "" ? "" : Number(val);
      } else if (type === "money") {
        const num = moneyToNumber(val);
        outgoing = (val === "" ? "" : num);
      } else if (type === "boolean") {
        outgoing = val === "true" || val === "1" || val === "yes";
      }
      const data = await saveContractField(contractId, field, outgoing);
      // reflect any canonical formatting returned by server
      if (type === "date") {
        const iso = data?.[field];
        const d = iso ? String(iso).slice(0,10) : "";
        setVal(d); lastSaved.current = d;
      } else if (type === "money") {
        const n = data?.[field] ?? null;
        const disp = n == null ? "" : moneyToDisplay(n);
        setVal(disp); lastSaved.current = disp;
      } else if (type === "number") {
        const n = data?.[field] ?? null;
        const disp = n == null ? "" : String(n);
        setVal(disp); lastSaved.current = disp;
      } else if (type === "boolean") {
        const b = !!data?.[field];
        const disp = b ? "true" : "false";
        setVal(disp); lastSaved.current = disp;
      } else {
        lastSaved.current = val;
      }
    } catch (e: any) {
      setErr(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const inputProps = {
    className:
      "w-full rounded-md border px-2 py-1 text-sm " +
      (saving ? "opacity-70 " : "") +
      (err ? "border-red-400 " : "border-slate-300 ") +
      (className || ""),
    onBlur,
    disabled: saving,
  };

  if (type === "boolean") {
    return (
      <select
        value={val}
        onChange={(e) => setVal(e.target.value)}
        {...(inputProps as any)}
      >
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    );
  }

  if (type === "date") {
    return (
      <input
        type="date"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        {...(inputProps as any)}
      />
    );
  }

  if (type === "number") {
    return (
      <input
        inputMode="numeric"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="—"
        {...(inputProps as any)}
      />
    );
  }

  if (type === "money") {
    return (
      <input
        inputMode="decimal"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="—"
        {...(inputProps as any)}
      />
    );
  }

  return (
    <input
      type="text"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      placeholder="—"
      {...(inputProps as any)}
    />
  );
}
