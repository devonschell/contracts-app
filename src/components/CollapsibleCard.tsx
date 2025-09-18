"use client";

import { useState } from "react";

export default function CollapsibleCard({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-b border-slate-200 px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-slate-800">{title}</span>
        <span className="text-slate-500">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}
