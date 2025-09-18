// src/components/AIAnalyzePanel.tsx
"use client";

import { useState } from "react";
import CollapsibleCard from "@/components/ui/CollapsibleCard";

export default function AIAnalyzePanel({ contractId }: { contractId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<number | null>(null);

  async function runAnalyze() {
    setBusy(true);
    setError(null);
    setExtracted(null);
    try {
      const res = await fetch(`/api/contracts/\${contractId}/ai/suggest`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!json?.ok) {
        setError(json?.error || "Analyze failed");
        if (typeof json?.extractedChars === "number") setExtracted(json.extractedChars);
        return;
      }
      setSummary(json.aiSummary || "(no summary)");
      if (typeof json?.extractedChars === "number") setExtracted(json.extractedChars);
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <CollapsibleCard title="AI Analysis" defaultOpen={false}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
            disabled={busy}
            onClick={runAnalyze}
          >
            {busy ? "Analyzing…" : "Analyze"}
          </button>
          {typeof extracted === "number" && (
            <span className="text-xs text-slate-500">extractedChars: {extracted}</span>
          )}
        </div>

        {error && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {!error && summary && (
          <pre className="whitespace-pre-wrap text-sm leading-5 text-slate-800">{summary}</pre>
        )}

        {!error && !summary && !busy && (
          <div className="text-sm text-slate-500">No summary yet.</div>
        )}
      </div>
    </CollapsibleCard>
  );
}
