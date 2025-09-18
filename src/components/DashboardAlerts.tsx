// src/components/DashboardAlerts.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type AlertItem = {
  id: string;
  counterparty: string;
  title: string;
  renewalDate: string | Date | null;
  bucket: "expired" | "7" | "30" | "90"; // urgency category
};

const LABELS: Record<AlertItem["bucket"], string> = {
  expired: "Expired",
  "7": "7 days",
  "30": "30 days",
  "90": "90 days",
};

export default function DashboardAlerts({
  items,
  colors,
  defaultWindow = "30", // show expired + 7 + 30 by default
}: {
  items: AlertItem[];
  colors: Record<AlertItem["bucket"], string>;
  defaultWindow?: "7" | "30" | "90" | "all";
}) {
  const [win, setWin] = useState<"7" | "30" | "90" | "all">(defaultWindow);

  const filtered = useMemo(() => {
    if (win === "all") return items;
    if (win === "7") return items.filter(i => i.bucket === "expired" || i.bucket === "7");
    if (win === "30") return items.filter(i => ["expired", "7", "30"].includes(i.bucket));
    return items.filter(i => ["expired", "7", "30", "90"].includes(i.bucket)); // "90"
  }, [items, win]);

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex gap-2 pb-3">
        {(["7", "30", "90", "all"] as const).map(k => (
          <button
            key={k}
            onClick={() => setWin(k)}
            aria-pressed={win === k}
            className={
              "rounded-md border px-3 py-1 text-sm focus:outline-none focus:ring " +
              (win === k ? "bg-black text-white" : "bg-white")
            }
          >
            {k === "all" ? "All" : `${k} days`}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500">
          {win === "7" && "Showing: Expired + 7 days"}
          {win === "30" && "Showing: Expired + 7 days + 30 days"}
          {win === "90" && "Showing: Expired + 7 days + 30 days + 90 days"}
          {win === "all" && "Showing all urgent"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="p-2 text-sm text-gray-500">No upcoming renewals in this window.</div>
      ) : (
        <ul className="space-y-2">
          {filtered.map(c => {
            const date = c.renewalDate
              ? new Date(c.renewalDate).toISOString().slice(0, 10)
              : "—";
            return (
              <li key={c.id} className="rounded-md border p-3 text-sm flex items-center gap-3">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: colors[c.bucket] }}
                  title={LABELS[c.bucket]}
                />
                <Link href={`/contracts/${c.id}`} className="underline">
                  {c.counterparty} — {c.title}
                </Link>
                <span className="ml-auto text-gray-600">{date}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
