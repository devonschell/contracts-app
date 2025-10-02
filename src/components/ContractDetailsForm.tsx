"use client";
import { useState } from "react";

type Contract = {
  id: string;
  title: string | null;
  counterparty: string | null;
  status: "ACTIVE" | "REVIEW" | "TERMINATED";
  startDate: string | null;
  endDate: string | null;
  renewalDate: string | null;
  monthlyFee: number | null;
  annualFee: number | null;
  lateFeePct: number | null;
  renewalNoticeDays: number | null;
  termLengthMonths: number | null;
  autoRenew: boolean | null;
  billingCadence: string | null;
  paymentCadence: string | null;
};

export default function ContractDetailsForm({ initial }: { initial: Contract }) {
  const [form, setForm] = useState(() => toForm(initial));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      const patch = toPatch(form);
      const res = await fetch(`/api/contracts/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patch }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Save failed (${res.status})`);
      setMsg("Saved");
    } catch (err: any) {
      setMsg(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      <Section title="Basics">
        <Field label="Title">
          <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Counterparty">
          <input className="input" value={form.counterparty} onChange={(e) => set("counterparty", e.target.value)} />
        </Field>
        <Field label="Status">
          <select className="input" value={form.status} onChange={(e) => set("status", e.target.value as any)}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="REVIEW">REVIEW</option>
            <option value="TERMINATED">TERMINATED</option>
          </select>
        </Field>
      </Section>

      <Section title="Dates">
        <Field label="Start date">
          <input type="date" className="input" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </Field>
        <Field label="End date">
          <input type="date" className="input" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
        </Field>
        <Field label="Renewal date">
          <input type="date" className="input" value={form.renewalDate} onChange={(e) => set("renewalDate", e.target.value)} />
        </Field>
      </Section>

      <Section title="Money & Terms">
        <Field label="Monthly fee">
          <input inputMode="decimal" className="input" value={form.monthlyFee} onChange={(e) => set("monthlyFee", e.target.value)} placeholder="e.g. 12500" />
        </Field>
        <Field label="Annual fee">
          <input inputMode="decimal" className="input" value={form.annualFee} onChange={(e) => set("annualFee", e.target.value)} placeholder="e.g. 150000" />
        </Field>
        <Field label="Late fee %">
          <input inputMode="decimal" className="input" value={form.lateFeePct} onChange={(e) => set("lateFeePct", e.target.value)} placeholder="e.g. 2" />
        </Field>
        <Field label="Renewal notice days">
          <input inputMode="numeric" className="input" value={form.renewalNoticeDays} onChange={(e) => set("renewalNoticeDays", e.target.value)} placeholder="e.g. 30" />
        </Field>
        <Field label="Term length (months)">
          <input inputMode="numeric" className="input" value={form.termLengthMonths} onChange={(e) => set("termLengthMonths", e.target.value)} placeholder="e.g. 12" />
        </Field>
      </Section>

      <Section title="Other">
        <Field label="Auto renew">
          <select className="input" value={form.autoRenew} onChange={(e) => set("autoRenew", e.target.value)}>
            <option value="">—</option>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </Field>
        <Field label="Billing cadence">
          <input className="input" value={form.billingCadence} onChange={(e) => set("billingCadence", e.target.value)} placeholder="MONTHLY | QUARTERLY | ANNUAL" />
        </Field>
        <Field label="Payment cadence">
          <input className="input" value={form.paymentCadence} onChange={(e) => set("paymentCadence", e.target.value)} placeholder="MONTHLY | QUARTERLY | ANNUAL" />
        </Field>
      </Section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? "Saving…" : "Save changes"}
        </button>
        {msg && <span className="text-sm text-slate-600">{msg}</span>}
      </div>

      <style jsx>{`
        .input { width:100%; border:1px solid #e5e7eb; border-radius:8px; padding:8px 10px; font-size:14px; }
        .grid { display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
        @media (max-width: 720px) { .grid { grid-template-columns: 1fr; } }
      `}</style>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      <div className="grid">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-slate-600">{label}</div>
      {children}
    </label>
  );
}

/* ------ helpers: form <-> patch ------ */
function toForm(c: Contract) {
  const iso = (d: any) => (d ? String(d).slice(0,10) : "");
  return {
    title: c.title ?? "",
    counterparty: c.counterparty ?? "",
    status: c.status ?? "ACTIVE",
    startDate: iso(c.startDate),
    endDate: iso(c.endDate),
    renewalDate: iso(c.renewalDate),
    monthlyFee: c.monthlyFee == null ? "" : String(c.monthlyFee),
    annualFee: c.annualFee == null ? "" : String(c.annualFee),
    lateFeePct: c.lateFeePct == null ? "" : String(c.lateFeePct),
    renewalNoticeDays: c.renewalNoticeDays == null ? "" : String(c.renewalNoticeDays),
    termLengthMonths: c.termLengthMonths == null ? "" : String(c.termLengthMonths),
    autoRenew: c.autoRenew == null ? "" : (c.autoRenew ? "true" : "false"),
    billingCadence: c.billingCadence ?? "",
    paymentCadence: c.paymentCadence ?? "",
  };
}
function toPatch(f: ReturnType<typeof toForm>) {
  return {
    title: f.title,
    counterparty: f.counterparty,
    status: f.status,
    startDate: f.startDate,
    endDate: f.endDate,
    renewalDate: f.renewalDate,
    monthlyFee: f.monthlyFee,
    annualFee: f.annualFee,
    lateFeePct: f.lateFeePct,
    renewalNoticeDays: f.renewalNoticeDays,
    termLengthMonths: f.termLengthMonths,
    autoRenew: f.autoRenew, // "true"/"false"/""
    billingCadence: f.billingCadence,
    paymentCadence: f.paymentCadence,
  };
}
