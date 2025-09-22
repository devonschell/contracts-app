// src/app/(app)/contracts/[id]/AiPanel.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CollapsibleCard from "@/components/CollapsibleCard";

function mdToHtml(md: string) {
  const esc = md.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const withBold = esc.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  return withBold.replace(/\n/g, "<br/>");
}

export default function AiPanel({
  contractId,
  aiSummary,
  currentName,
}: {
  contractId: string;
  aiSummary: string | null;
  currentName: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState(aiSummary ?? "");
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<number | null>(null);

  const analyze = async () => {
    try {
      setBusy(true);
      setError(null);
      const res = await fetch(`/api/contracts/${contractId}/ai/suggest`, { method: "POST" });
      const raw = await res.text();
      let json: any = {};
      try { json = JSON.parse(raw); } catch { throw new Error(raw.slice(0, 300)); }

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Analyze failed (${res.status})`);
      }

      setSummary(json.aiSummary || "");
      setExtracted(typeof json.extractedChars === "number" ? json.extractedChars : null);

      // 🔄 ensure Details section shows AI-filled fields immediately
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Analyze failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <CollapsibleCard title="AI Summary" defaultOpen={true}>
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          className="rounded-md bg-black px-3 py-1.5 text-sm text-white disabled:opacity-60"
          disabled={busy}
          onClick={analyze}
        >
          {busy ? "Analyzing…" : "Analyze"}
        </button>
        {typeof extracted === "number" && (
          <span className="text-xs text-slate-500">extractedChars: {extracted}</span>
        )}
      </div>

      {currentName && (
        <div className="mb-2 text-xs text-slate-500">
          File: <span className="font-medium">{currentName}</span>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </div>
      )}

      {!error && summary && (
        <div
          className="text-sm leading-5 text-slate-800"
          dangerouslySetInnerHTML={{ __html: mdToHtml(summary) }}
        />
      )}

      {!error && !summary && !busy && (
        <div className="text-sm text-slate-500">No summary yet.</div>
      )}
    </CollapsibleCard>
  );
}
