"use client";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/company").then(r => r.json()).then(j => {
      if (j?.ok) setCompany(j.companyName || "");
    }).catch(()=>{});
  }, []);

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch("/api/settings/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: company }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Save failed");
      setMsg("Saved.");
    } catch (e:any) {
      setMsg(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="mb-4 text-2xl font-semibold">Settings</h1>
      <label className="text-sm font-medium text-slate-700">Your company name</label>
      <input
        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="e.g., ABC Software"
      />
      <p className="mt-1 text-xs text-slate-500">Used to infer the counterparty when both parties appear in a contract.</p>
      <button onClick={save} disabled={saving} className="mt-3 rounded-md bg-black px-3 py-2 text-white text-sm">
        {saving ? "Saving…" : "Save"}
      </button>
      {msg && <div className="mt-2 text-sm text-slate-600">{msg}</div>}
    </div>
  );
}
