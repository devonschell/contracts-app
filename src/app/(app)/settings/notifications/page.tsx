"use client";

import { useEffect, useState } from "react";

export default function NotificationsSettingsPage() {
  const [recipients, setRecipients] = useState<string>("");
  const [days, setDays] = useState<string>("30,14,7,1");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const j = await fetch("/api/settings/notifications").then(r => r.json()).catch(() => null);
      if (j?.ok) {
        setRecipients((j.recipients || []).join(", "));
        setDays((j.reminderDays || [30]).join(","));
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const recipientsArr = recipients.split(",").map(s => s.trim()).filter(Boolean);
      const daysArr = days.split(",").map(s => Number(s.trim())).filter(n => Number.isFinite(n) && n >= 0);

      const res = await fetch("/api/settings/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients: recipientsArr, reminderDays: daysArr }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || res.statusText);
      alert("Saved.");
    } catch (e:any) {
      alert(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="text-sm text-slate-500">Settings</div>
        <h1 className="mt-1 text-2xl font-semibold">Notifications</h1>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
        <div>
          <div className="text-sm font-semibold text-slate-800">Recipients</div>
          <input
            value={recipients}
            onChange={(e)=>setRecipients(e.target.value)}
            className="mt-1 w-full max-w-xl rounded border px-3 py-2 text-sm"
            placeholder="name@company.com, ops@company.com"
          />
          <p className="mt-1 text-xs text-slate-500">Comma-separated email addresses.</p>
        </div>

        <div>
          <div className="text-sm font-semibold text-slate-800">Reminder days</div>
          <input
            value={days}
            onChange={(e)=>setDays(e.target.value)}
            className="mt-1 w-64 rounded border px-3 py-2 text-sm"
            placeholder="30,14,7,1"
          />
          <p className="mt-1 text-xs text-slate-500">Days before renewal to notify.</p>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
