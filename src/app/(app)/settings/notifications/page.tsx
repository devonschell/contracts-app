"use client";

import { useEffect, useState } from "react";

/* ---------- Email Chips Input ---------- */
function EmailChipsInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (newCsv: string) => void;
}) {
  const [emails, setEmails] = useState<string[]>(
    value ? value.split(",").map((e) => e.trim()) : []
  );
  const [input, setInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim() !== "") {
      e.preventDefault();
      const trimmed = input.trim();
      if (validateEmail(trimmed) && !emails.includes(trimmed)) {
        const updated = [...emails, trimmed];
        setEmails(updated);
        onChange(updated.join(", "));
        setInput("");
      }
    }
  };

  const removeEmail = (email: string) => {
    const updated = emails.filter((e) => e !== email);
    setEmails(updated);
    onChange(updated.join(", "));
  };

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="border border-border rounded-lg p-2 flex flex-wrap gap-2 bg-white">
      {emails.map((email) => (
        <div
          key={email}
          className="flex items-center bg-[var(--primary)]/10 text-[var(--primary)] text-sm px-2 py-1 rounded-full"
        >
          {email}
          <button
            onClick={() => removeEmail(email)}
            className="ml-1 text-xs text-[var(--primary)]/70 hover:text-[var(--primary)]"
          >
            ×
          </button>
        </div>
      ))}
      <input
        type="email"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type email and press Enter"
        className="flex-1 outline-none text-sm min-w-[160px]"
      />
    </div>
  );
}

/* ---------- Main Page ---------- */

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
      <p className="text-sm text-muted-foreground">
        Manage who receives renewal alerts and when they’re sent.
      </p>

      {/* Email Recipients */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Email Recipients
        </label>
        <EmailChipsInput
          value={prefs.recipientsCsv}
          onChange={(newCsv) =>
            setPrefs({ ...prefs, recipientsCsv: newCsv })
          }
        />
        <p className="text-xs text-gray-500">
          We’ll email these addresses for renewal alerts.
        </p>
      </div>

      {/* Alerts Checkboxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={prefs.renewalAlerts}
            onChange={(e) =>
              setPrefs({ ...prefs, renewalAlerts: e.target.checked })
            }
          />
          Renewal alerts
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={prefs.weeklyDigest}
            onChange={(e) =>
              setPrefs({ ...prefs, weeklyDigest: e.target.checked })
            }
          />
          Weekly digest (coming soon)
        </label>
      </div>

      {/* Notice Days */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Reminder lead time (days before renewal)
        </label>
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
          We’ll send renewal reminders this many days before a contract’s renewal date.
        </p>
      </div>

      {/* Save Button */}
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
