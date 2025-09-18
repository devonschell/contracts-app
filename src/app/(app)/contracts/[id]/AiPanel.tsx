"use client";
import { useState } from "react";
import CollapsibleCard from "@/components/CollapsibleCard";

export default function AiPanel({ contractId, aiSummary, currentName }: {
  contractId: string;
  aiSummary?: string | null;
  currentName?: string | null;
}) {
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}/ai/suggest`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) alert(json?.error || "AI analyze failed");
      else location.reload();
    } catch (e: any) {
      alert(e?.message || "AI analyze failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <CollapsibleCard title="AI Summary" defaultOpen={false}>
      {aiSummary ? (
        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{aiSummary}</pre>
      ) : (
        <div className="text-sm text-slate-600">
          No AI summary saved for <span className="font-medium">{currentName || "current file"}</span>.<br />
          Re-upload a text-based PDF/DOCX and ensure OPENAI_API_KEY is set, then click Analyze.
        </div>
      )}
      <button
        onClick={run}
        disabled={busy}
        className="mt-3 rounded-md border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
        title="Analyze the current file and fill fields"
      >
        {busy ? "Analyzing…" : "Analyze current file"}
      </button>
    </CollapsibleCard>
  );
}
