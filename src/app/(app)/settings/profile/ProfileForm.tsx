"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const CURRENCIES = [
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "AUD", label: "Australian Dollar" },
];

type Initial = {
  companyName: string;
  timezone: string;
  currency: string;
  renewalLeadDaysDefault: number;
};

export default function ProfileForm({ initial }: { initial: Initial }) {
  const [companyName, setCompanyName] = useState(initial.companyName);
  const [timezone, setTimezone] = useState(initial.timezone || "America/New_York");
  const [currency, setCurrency] = useState(initial.currency || "USD");
  const [leadDays, setLeadDays] = useState<number | string>(initial.renewalLeadDaysDefault ?? 45);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(leadDays);
    if (!companyName.trim()) return alert("Company name is required.");
    if (!timezone) return alert("Timezone is required.");
    if (!/^[A-Z]{3}$/.test(currency)) return alert("Currency must be a 3-letter code.");
    if (!Number.isFinite(n) || n < 0 || n > 365) return alert("Default renewal lead days must be 0–365.");

    try {
      setSaving(true);
      const res = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          companyName: companyName.trim(),
          timezone,
          currency,
          renewalLeadDaysDefault: n,
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
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Company name</label>
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          placeholder="e.g., Cool Breeze Cleaning LLC"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Timezone</label>
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Currency</label>
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code} — {c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Default renewal lead days</label>
        <input
          type="number"
          min={0}
          max={365}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          placeholder="e.g., 45"
          value={leadDays}
          onChange={(e) => setLeadDays(e.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">
          Used as the default “notify me X days before renewal” when a contract doesn’t specify its own window.
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
