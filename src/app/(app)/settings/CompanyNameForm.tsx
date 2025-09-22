"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CompanyNameForm({ initial }: { initial: string }) {
  const [name, setName] = useState(initial ?? "");
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
        body: JSON.stringify({ companyName: name.trim() }),
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
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">Company name</label>
      <input
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        placeholder="e.g., Cool Breeze Cleaning LLC"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
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
