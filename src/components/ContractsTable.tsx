"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

/* ---------- Types from your page ---------- */

export type LatestUpload = {
  id: string;
  url: string;
  originalName: string;
  createdAt: string | Date;
};

export type ContractRow = {
  id: string;
  counterparty: string | null;
  title: string | null;
  status: "ACTIVE" | "REVIEW" | "TERMINATED";
  renewalDate: string | Date | null;
  renewalNoticeDays?: number | null;
  autoRenew?: boolean | null;
  latestUpload?: LatestUpload | null;
};

type Props = {
  rows?: ContractRow[];
  contracts?: ContractRow[];
  mode?: "active" | "deleted";
};

/* ---------- Component ---------- */

export default function ContractsTable({ rows, contracts, mode = "active" }: Props) {
  const data = useMemo(() => rows ?? contracts ?? [], [rows, contracts]);

  // which row's menu is open
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  const openMenuAt = (id: string, triggerEl: HTMLElement) => {
    const rect = triggerEl.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 6, left: rect.right - 208 }); // 208px ≈ menu width
    setOpenMenuFor(id);
  };
  const closeMenu = () => { setOpenMenuFor(null); setMenuPos(null); };

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") closeMenu(); };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        No contracts yet.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr className="text-left">
              <Th>Counterparty</Th>
              <Th>Title</Th>
              <Th>Status</Th>
              <Th>Renewal</Th>
              <Th className="w-10 text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60">
                <Td>
                  {row.counterparty ? (
                    <span className="text-slate-900">{row.counterparty}</span>
                  ) : (
                    <span className="text-slate-400">Unknown</span>
                  )}
                </Td>

                <Td>
                  <Link
                    href={`/contracts/${row.id}`}
                    onClick={closeMenu}
                    className="text-slate-900 no-underline hover:underline underline-offset-4 decoration-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 rounded-sm"
                  >
                    {row.title ?? row.latestUpload?.originalName ?? "Untitled Contract"}
                  </Link>
                </Td>

                <Td><StatusBadge status={row.status} /></Td>

                <Td>
                  {renderRenewal({
                    date: row.renewalDate,
                    noticeDays: row.renewalNoticeDays ?? undefined,
                    autoRenew: row.autoRenew ?? undefined,
                  })}
                </Td>

                <Td className="text-right">
                  <RowMenuTrigger
                    id={row.id}
                    onOpen={(id, el) => openMenuAt(id, el)}
                    isOpen={openMenuFor === row.id}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Floating menu (no backdrop; closes on outside click) */}
      {openMenuFor && menuPos && (
        <RowMenuFloating
          id={openMenuFor}
          latestUrl={data.find(d => d.id === openMenuFor)?.latestUpload?.url}
          top={menuPos.top}
          left={menuPos.left}
          onClose={closeMenu}
          mode={mode}
        />
      )}
    </>
  );
}

/* ---------- Trigger button ---------- */

function RowMenuTrigger({
  id,
  onOpen,
  isOpen,
}: {
  id: string;
  onOpen: (id: string, el: HTMLElement) => void;
  isOpen: boolean;
}) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  return (
    <button
      ref={btnRef}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      aria-label="Actions"
      onClick={(e) => {
        e.stopPropagation();
        if (btnRef.current) onOpen(id, btnRef.current);
      }}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer"
    >
      …
    </button>
  );
}

/* ---------- Floating menu (closes on outside click) ---------- */

function RowMenuFloating({
  id,
  latestUrl,
  top,
  left,
  onClose,
  mode,
}: {
  id: string;
  latestUrl?: string | null;
  top: number;
  left: number;
  onClose: () => void;
  mode: "active" | "deleted";
}) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // close when clicking outside the menu
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onClose]);

  // API helpers
  const softDelete = async () => {
    setBusy(true);
    const res = await fetch(`/api/contracts/${id}/delete`, { method: "POST" });
    setBusy(false);
    if (res.ok) { onClose(); window.location.reload(); }
    else {
      const err = await res.json().catch(() => ({}));
      alert("Delete failed: " + (err?.error || res.statusText));
    }
  };

  const recover = async () => {
    setBusy(true);
    const res = await fetch(`/api/contracts/${id}/recover`, { method: "POST" });
    setBusy(false);
    if (res.ok) { onClose(); window.location.reload(); }
    else {
      const err = await res.json().catch(() => ({}));
      alert("Recover failed: " + (err?.error || res.statusText));
    }
  };

  const hardDelete = async () => {
    if (!confirm("Permanently delete this contract and all uploads? This cannot be undone.")) return;
    setBusy(true);
    const res = await fetch(`/api/contracts/${id}/hard-delete`, { method: "POST" });
    setBusy(false);
    if (res.ok) { onClose(); window.location.reload(); }
    else {
      const err = await res.json().catch(() => ({}));
      alert("Permanent delete failed: " + (err?.error || res.statusText));
    }
  };

  const triggerReplace = () => fileRef.current?.click();
  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("files", f); // or "file" if you switch your API
      form.append("contractId", id);
      form.append("override", "true");

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload", true);
      xhr.onreadystatechange = () => {
        if (xhr.readyState !== XMLHttpRequest.DONE) return;
        setBusy(false);
        try {
          const json = JSON.parse(xhr.responseText || "{}");
          if (xhr.status >= 200 && xhr.status < 300 && json?.ok) {
            onClose(); window.location.reload();
          } else {
            alert("Replace failed: " + (json?.error || xhr.statusText));
          }
        } catch { alert("Replace failed: bad response"); }
      };
      xhr.onerror = () => { setBusy(false); alert("Replace failed: network error"); };
      xhr.send(form);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={onFileChosen}
      />
      <div
        ref={menuRef}
        className="fixed z-50 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
        style={{ top, left }}
        onClick={(e) => e.stopPropagation()}
        role="menu"
      >
        {/* Use onClick to close the menu before navigation so nothing blocks */}
        <MenuItem href={`/contracts/${id}`} onClick={onClose}>Open</MenuItem>

        {mode === "active" && (
          <>
            {latestUrl ? (
              <MenuItem as="a" href={latestUrl} download>Download latest file</MenuItem>
            ) : (
              <MenuItem disabled>Download latest file</MenuItem>
            )}
            <MenuItem onClick={triggerReplace}>{busy ? "Updating…" : "Update / replace"}</MenuItem>
            <MenuSeparator />
            <MenuItem destructive onClick={softDelete}>Delete</MenuItem>
          </>
        )}

        {mode === "deleted" && (
          <>
            <MenuItem onClick={recover}>{busy ? "Recovering…" : "Recover"}</MenuItem>
            <MenuSeparator />
            <MenuItem destructive onClick={hardDelete}>{busy ? "Deleting…" : "Permanently delete"}</MenuItem>
          </>
        )}
      </div>
    </>
  );
}

/* ---------- Small presentational helpers ---------- */

function MenuItem({
  children,
  href,
  as,
  onClick,
  disabled,
  destructive,
  download,
}: {
  children: React.ReactNode;
  href?: string;
  as?: "a";
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  download?: boolean;
}) {
  const classes = [
    "block w-full text-left px-3 py-2 text-sm",
    disabled ? "text-slate-300 cursor-not-allowed" : "text-slate-700 hover:bg-slate-50 cursor-pointer",
    destructive ? "text-red-600 hover:bg-red-50" : "",
  ].join(" ");

  if (as === "a" && href) {
    return (
      <a className={classes} href={href} download={download} onClick={onClick}>
        {children}
      </a>
    );
  }
  if (href) {
    return (
      <Link className={classes} href={href} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} onClick={disabled ? undefined : onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function MenuSeparator() {
  return <div className="my-1 h-px bg-slate-200" />;
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

function StatusBadge({ status }: { status: ContractRow["status"] }) {
  const styles =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "REVIEW"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-slate-100 text-slate-700 border-slate-300";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles}`}>{status}</span>;
}

/* ---------- Renewal rendering ---------- */

function renderRenewal({
  date,
  noticeDays,
  autoRenew,
}: {
  date: string | Date | null;
  noticeDays?: number;
  autoRenew?: boolean;
}) {
  if (!date) return <span className="text-slate-400">—</span>;
  const dt = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(dt.getTime())) return <span className="text-slate-400">—</span>;

  const today = new Date();
  const diffMs = dt.getTime() - stripTime(today).getTime();
  const diffDays = Math.round(diffMs / 86400000);
  const labelDate = dt.toLocaleDateString();
  const windowDays = typeof noticeDays === "number" && noticeDays > 0 ? noticeDays : 30;

  if (diffDays < 0) return <span className="text-red-600 font-medium">Overdue • {labelDate}</span>;
  if (diffDays <= windowDays) return <span className="text-amber-600 font-medium">Due in {diffDays}d • {labelDate}</span>;
  return <span className="text-slate-700">{labelDate}{autoRenew ? <span className="ml-1 text-slate-400">(auto-renew)</span> : null}</span>;
}

function stripTime(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
