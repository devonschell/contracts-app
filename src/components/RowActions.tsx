// src/components/RowActions.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type OpenEvent = CustomEvent<{ id: string }>;

export default function RowActions({
  contractId,
  latestUrl,
  isDeleted = false,
}: {
  contractId: string;
  latestUrl?: string;
  isDeleted?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<null | "delete" | "restore" | "hard">(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onAnyOpen = (e: Event) => {
      const { id } = (e as OpenEvent).detail || {};
      if (id !== contractId) setOpen(false);
    };
    window.addEventListener("row-actions-open", onAnyOpen as EventListener);
    return () =>
      window.removeEventListener("row-actions-open", onAnyOpen as EventListener);
  }, [contractId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const announceOpen = () => {
    const evt = new CustomEvent("row-actions-open", { detail: { id: contractId } });
    window.dispatchEvent(evt);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!open) announceOpen();
    setOpen(v => !v);
  };

  const softDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    if (!confirm("Move this contract to Deleted?")) return;
    try {
      setBusy("delete");
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      alert(err?.message || "Failed to delete");
    } finally {
      setBusy(null);
    }
  };

  const hardDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    if (!confirm("Permanently delete this contract and its files? This cannot be undone.")) return;
    try {
      setBusy("hard");
      const res = await fetch(`/api/contracts/${contractId}?hard=1`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Permanent delete failed");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      alert(err?.message || "Failed to permanently delete");
    } finally {
      setBusy(null);
    }
  };

  const restore = async (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    try {
      setBusy("restore");
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      if (!res.ok) throw new Error("Restore failed");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      alert(err?.message || "Failed to restore");
    } finally {
      setBusy(null);
    }
  };

  const download = (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    if (latestUrl) window.open(latestUrl, "_blank", "noreferrer");
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setOpen(false);
          }}
        />
      )}

      <div className="relative inline-block text-left">
        <button
          onClick={toggleMenu}
          className="rounded px-2 py-1 hover:bg-gray-100 cursor-pointer"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={`row-actions-${contractId}`}
        >
          ⋯
        </button>

        {open && (
          <div
            id={`row-actions-${contractId}`}
            ref={menuRef}
            className="absolute right-0 z-50 mt-1 w-44 rounded-md border bg-white shadow-lg ring-1 ring-black/5 cursor-pointer"
            role="menu"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            {/* Wider right-side white mask to hide underlying dots */}
            <div className="pointer-events-none absolute -right-12 top-0 bottom-0 w-16 bg-white rounded-r-md" />

            {!isDeleted ? (
              <>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 cursor-pointer"
                  onClick={download}
                  disabled={!latestUrl}
                  role="menuitem"
                >
                  Download PDF
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    alert("Update (replace) happens inside the contract detail for now.");
                    setOpen(false);
                  }}
                  role="menuitem"
                >
                  Update (replace)
                </button>
                <div className="border-t my-1" />
                <button
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                  onClick={softDelete}
                  disabled={busy === "delete"}
                  role="menuitem"
                >
                  {busy === "delete" ? "Deleting…" : "Delete"}
                </button>
              </>
            ) : (
              <>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 cursor-pointer"
                  onClick={restore}
                  disabled={busy === "restore"}
                  role="menuitem"
                >
                  {busy === "restore" ? "Restoring…" : "Restore"}
                </button>
                <div className="border-t my-1" />
                <button
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                  onClick={hardDelete}
                  disabled={busy === "hard"}
                  role="menuitem"
                  title="This cannot be undone"
                >
                  {busy === "hard" ? "Deleting…" : "Permanently delete"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
