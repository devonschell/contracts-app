"use client";

import { useRouter } from "next/navigation";

type Item = {
  id: string;
  originalName: string | null;
  url: string | null;
  bytes: number | null;
  createdAt: string | Date;
};

export default function FileHistory({ items }: { items: Item[] }) {
  const router = useRouter();

  const onDelete = async (id: string) => {
    if (!confirm("Delete this file from history?")) return;
    try {
      const res = await fetch(`/api/uploads/${id}`, { method: "DELETE", credentials: "include" });
      const text = await res.text();
      const json = safeJSON(text);
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Delete failed (${res.status})`);
      router.refresh();
    } catch (err: any) {
      alert(err?.message || "Delete failed.");
    }
  };

  if (!items?.length) {
    return <div className="text-sm text-gray-500">No uploads yet. Upload a file to see its history here.</div>;
  }

  return (
    <div className="divide-y">
      {items.map((u, i) => (
        <div key={u.id} className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 min-w-[48px]">{i === 0 ? "Latest" : ""}</span>
            {u.url ? (
              <a href={u.url} className="underline" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                {u.originalName ?? "File"}
              </a>
            ) : (
              <span className="text-gray-500">No URL</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {fmtDate(u.createdAt)}{u.bytes ? ` • ${fmtBytes(u.bytes)}` : ""}
            </span>
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(u.id); }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function fmtDate(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString();
}
function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  const kb = b / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}
function safeJSON(text: string) {
  try { return JSON.parse(text); } catch { return null; }
}
