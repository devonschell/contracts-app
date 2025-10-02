"use client";

import { useEffect, useState } from "react";

type Prefs = {
  recipientsCsv: string;
  renewalAlerts: boolean;
  weeklyDigest: boolean;
  noticeDays: number;
};

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings/notifications")
      .then((r) => r.json())
      .then((j) => setPrefs(j.data))
      .catch(() =>
        setPrefs({
          recipientsCsv: "",
          renewalAlerts: true,
          weeklyDigest: true,
          noticeDays: 30,
        })
      );
  }, []);

  if (!prefs) return <div className="p-6">Loading…</div>;

  async function onSave() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/settings/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    setSaving(false);
    setMsg(res.ok ? "Saved ✓" : "Save failed");
  }

  return (
    <div className="max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Notifications</h1>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Recipients (comma-separated)</label>
        <input
          className="w-full rounded-lg border p-2"
          value={prefs.recipientsCsv}
          onChange={(e) => setPrefs({ ...prefs, recipientsCsv: e.target.value })}
          placeholder="ops@yourco.com, legal@yourco.com"
        />
        <p className="text-xs text-gray-500">
          We’ll email these addresses for renewal alerts and digests.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={prefs.renewalAlerts}
            onChange={(e) => setPrefs({ ...prefs, renewalAlerts: e.target.checked })}
          />
          Renewal alerts
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={prefs.weeklyDigest}
            onChange={(e) => setPrefs({ ...prefs, weeklyDigest: e.target.checked })}
          />
          Weekly digest (coming soon)
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Notice days</label>
        <input
          type="number"
          min={1}
          max={365}
          className="w-32 rounded-lg border p-2"
          value={prefs.noticeDays}
          onChange={(e) =>
            setPrefs({ ...prefs, noticeDays: Number(e.target.value) || 30 })
          }
        />
        <p className="text-xs text-gray-500">
          Default lead time when a contract doesn’t specify its own.
        </p>
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="rounded-xl px-4 py-2 border shadow-sm"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      {msg && <div className="text-sm">{msg}</div>}
    </div>
  );
}
