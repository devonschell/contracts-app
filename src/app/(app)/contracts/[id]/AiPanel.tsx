"use client";
import { useState } from "react";
import CollapsibleCard from "@/components/CollapsibleCard";

export default function AiPanel({
  contractId,
  aiSummary,
  currentName,
}: {
  contractId: string;
  aiSummary?: string | null;
  currentName?: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/contracts/${contractId}/ai/suggest`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error || "AI analyze failed");
      setMsg("Analyzed. Reloading…");
      location.reload();
    } catch (e: any) {
      setMsg(e?.message || "AI analyze failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <CollapsibleCard title="AI Summary" defaultOpen={false}>
      {aiSummary ? (
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {renderWithBold(aiSummary)}
        </div>
      ) : (
        <div className="text-sm text-slate-600">
          No AI summary saved for <span className="font-medium">{currentName || "current file"}</span>.
          <br />
          Click Analyze to generate one now.
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
      {msg && <div className="mt-2 text-xs text-slate-500">{msg}</div>}
    </CollapsibleCard>
  );
}

/** Replace **bold** segments with <strong> while keeping everything else plain text. */
function renderWithBold(text: string) {
  const out: (string | JSX.Element)[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<strong key={out.length}>{m[1]}</strong>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
