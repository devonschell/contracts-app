"use client";

import { useState, useMemo } from "react";

type UploadLite = {
  url: string;
  originalName: string;
  createdAt?: string | Date;
};

type DeletedRow = {
  id: string;
  counterparty: string;
  title: string;
  status: "ACTIVE" | "REVIEW" | "TERMINATED";
  renewalDate: string | Date | null;
  uploads: UploadLite[];
  deletedAt: string | Date;
};

export default function DeletedTable({ contracts }: { contracts: DeletedRow[] }) {
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return contracts.filter((c) => {
      const hay = [c.counterparty, c.title, c.status].join(" ").toLowerCase();
      return s === "" ? true : hay.includes(s);
    });
  }, [contracts, q]);

  const restore = async (id: string) => {
    if (busyId) return;
    try {
      setBusyId(id);
      const res = await fetch(`/api/contracts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ restore: true }),
      });
      if (!res.ok) throw new Error(await res.text());
      location.reload(); // simplest refresh
    } catch (e: any) {
      alert(e.message || "Restore failed");
    } finally {
      setBusyId(null);
    }
  };

  const destroy = async (id: string) => {
    if (busyId) return;
    if (!confirm("Permanently delete this contract and all files? This cannot be undone.")) return;
    try {
      setBusyId(id);
      const res = await fetch(`/api/contracts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      location.reload();
    } catch (e: any) {
      alert(e.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          className="w-full sm:max-w-md rounded-md border px-3 py-2 text-sm"
          placeholder="Search deleted (counterparty, title, status)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="rounded-lg border bg-white">
        <div className="grid grid-cols-6 gap-2 border-b p-3 text-xs font-medium text-gray-600">
          <div>Counterparty</div>
          <div>Title</div>
          <div>Status</div>
          <div>Deleted</div>
          <div>Latest file</div>
          <div className="text-right pr-2">Actions</div>
        </div>

        {filtered.length === 0 && (
          <div className="p-4 text-sm text-gray-500">No deleted contracts.</div>
        )}

        {filtered.map((c) => {
          const latest = c.uploads?.[0];
          const deletedISO = c.deletedAt
            ? new Date(c.deletedAt as any).toISOString().slice(0, 10)
            : "—";

          return (
            <div key={c.id} className="grid grid-cols-6 gap-2 p-3 text-sm hover:bg-gray-50">
              <div className="truncate">{c.counterparty}</div>
              <div className="truncate">{c.title}</div>
              <div className="truncate capitalize">{c.status.toLowerCase()}</div>
              <div className="truncate">{deletedISO}</div>

              <div className="truncate">
                {latest ? (
                  <a className="underline" href={latest.url} target="_blank" rel="noreferrer">
                    {latest.originalName}
                  </a>
                ) : (
                  <span className="text-gray-400">No file</span>
                )}
              </div>

              <div className="text-right pr-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => restore(c.id)}
                  disabled={busyId === c.id}
                  className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                >
                  {busyId === c.id ? "Restoring…" : "Restore"}
                </button>
                <button
                  onClick={() => destroy(c.id)}
                  disabled={busyId === c.id}
                  className="rounded-md border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  {busyId === c.id ? "Deleting…" : "Delete forever"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
