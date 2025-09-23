"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CompanyNameForm(props: {
  initial: string;
  initialBillingEmail?: string;
  initialTimezone?: string;
  initialCurrency?: string;
  initialRenewalLeadDays?: number | null;
}) {
  const [name, setName] = useState(props.initial ?? "");
  const [billingEmail, setBillingEmail] = useState(props.initialBillingEmail ?? "");
  const [timezone, setTimezone] = useState(props.initialTimezone ?? "");
  const [currency, setCurrency] = useState(props.initialCurrency ?? "");
  const [leadDays, setLeadDays] = useState<string>(
    props.initialRenewalLeadDays != null ? String(props.initialRenewalLeadDays) : ""
  );

  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          companyName: name.trim(),
          billingEmail: billingEmail.trim() || null,
          timezone: timezone.trim() || null,
          currency: currency.trim() || null,
          renewalLeadDaysDefault: leadDays.trim() ? Number(leadDays) : null,
        }),
      });
      if (!res.ok) {
        let msg = "Save failed";
        try { msg = (await res.json())?.error || msg; } catch {}
        throw new Error(msg);
      }
      router.refresh();
    } catch (err: any) {
      alert(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Company */}
      <div>
        <label className="block text-sm font-medium text-slate-700">Company name</label>
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          placeholder="e.g., Cool Breeze Cleaning LLC"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Billing email */}
      <div>
        <label className="block text-sm font-medium text-slate-700">Billing email</label>
        <input
          type="email"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          placeholder="billing@yourcompany.com"
          value={billingEmail}
          onChange={(e) => setBillingEmail(e.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">Used for invoices and renewal notifications (optional).</p>
      </div>

      {/* Timezone / Currency */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      {/* Default renewal lead days */}
      <div>
        <label className="block text-sm font-medium text-slate-700">Default renewal lead days</label>
        <input
          type="number"
          min={0}
          className="mt-1 w-40 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          placeholder="e.g., 45"
          value={leadDays}
          onChange={(e) => setLeadDays(e.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">
          We’ll use this as the default “notify me X days before renewal” value when a contract doesn’t specify one.
        </p>
      </div>

      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
