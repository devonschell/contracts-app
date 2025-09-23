"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  companyName: string;
  billingEmail: string;
  timezone: string;
  currency: string;
  renewalLeadDaysDefault?: number;
};

export default function ProfileForm({ initial }: { initial: Initial }) {
  const [companyName, setCompanyName] = useState(initial.companyName);
  const [billingEmail, setBillingEmail] = useState(initial.billingEmail);
  const [timezone, setTimezone] = useState(initial.timezone || "America/New_York");
  const [currency, setCurrency] = useState(initial.currency || "USD");
  const [leadDays, setLeadDays] = useState<number | "">(initial.renewalLeadDaysDefault ?? "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          companyName: companyName.trim(),
          billingEmail: billingEmail.trim() || null,
          timezone: timezone || null,
          currency: currency || "USD",
          renewalLeadDaysDefault:
            typeof leadDays === "number" ? Math.max(0, Math.round(leadDays)) : null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) throw new Error(json?.error || "Save failed");
      router.refresh();
    } catch (err: any) {
      alert(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Company name</label>
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          placeholder="e.g., Cool Breeze Cleaning LLC"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Billing email</label>
        <input
          type="email"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          placeholder="billing@yourcompany.com"
          value={billingEmail}
          onChange={(e) => setBillingEmail(e.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">Used for invoices and renewal notifications.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Timezone</label>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            placeholder="America/New_York"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Currency</label>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            placeholder="USD"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Default renewal lead days</label>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          placeholder="e.g., 45"
          value={leadDays}
          onChange={(e) => {
            const v = e.target.value.replace(/\D+/g, "");
            setLeadDays(v === "" ? "" : Number(v));
          }}
        />
        <p className="mt-1 text-xs text-slate-500">
          Used as the default “notify X days before renewal” when a contract doesn’t specify one.
        </p>
      </div>

      <button
        type="submit"
        disabled={saving || !companyName.trim()}
        className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
