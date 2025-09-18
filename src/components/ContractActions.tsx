"use client";

import { useState } from "react";

export default function ContractActions({
  contractId,
  isDeleted,
}: {
  contractId: string;
  isDeleted: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const call = async (url: string, confirmText?: string) => {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(url);
    try {
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || res.statusText);
      }
      if (url.includes("hard-delete")) {
        window.location.href = "/contracts?tab=deleted";
      } else {
        window.location.reload();
      }
    } catch (e: any) {
      alert(e?.message || "Action failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2">
      {!isDeleted ? (
        <button
          onClick={() => call(`/api/contracts/${contractId}/delete`)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
          disabled={busy !== null}
        >
          {busy?.includes("/delete") ? "Deleting…" : "Move to Deleted"}
        </button>
      ) : (
        <>
          <button
            onClick={() => call(`/api/contracts/${contractId}/recover`)}
            className="w-full rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
            disabled={busy !== null}
          >
            {busy?.includes("/recover") ? "Recovering…" : "Recover"}
          </button>
          <button
            onClick={() =>
              call(
                `/api/contracts/${contractId}/hard-delete`,
                "Permanently delete this contract and all uploads? This cannot be undone."
              )
            }
            className="w-full rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100 disabled:opacity-60"
            disabled={busy !== null}
          >
            {busy?.includes("hard-delete") ? "Deleting…" : "Permanently delete"}
          </button>
        </>
      )}
    </div>
  );
}
