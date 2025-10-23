"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type AlertItem = {
  id: string;
  counterparty: string;
  title: string;
  renewalDate: string | Date | null;
  bucket: "expired" | "7" | "30" | "90";
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
  defaultWindow = "30",
}: {
  items: AlertItem[];
  colors: Record<AlertItem["bucket"], string>;
  defaultWindow?: "7" | "30" | "90" | "all";
}) {
  const [win, setWin] = useState<"7" | "30" | "90" | "all">(defaultWindow);

  const filtered = useMemo(() => {
    if (win === "all") return items;
    if (win === "7") return items.filter((i) => i.bucket === "expired" || i.bucket === "7");
    if (win === "30") return items.filter((i) => ["expired", "7", "30"].includes(i.bucket));
    return items.filter((i) => ["expired", "7", "30", "90"].includes(i.bucket));
  }, [items, win]);

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      {/* FILTER BUTTONS */}
      <div className="flex gap-2 pb-3">
        {(["7", "30", "90", "all"] as const).map((k) => {
          const isActive = win === k;
          return (
            <button
              key={k}
              onClick={() => setWin(k)}
              aria-pressed={isActive}
              className={
                "rounded-md border px-3 py-1 text-sm font-medium transition-colors " +
                (isActive
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 hover:bg-gray-100")
              }
            >
              {k === "all" ? "All" : `${k} days`}
            </button>
          );
        })}

        <span className="ml-auto text-xs text-gray-500">
          {win === "7" && "Showing: Expired + 7 days"}
          {win === "30" && "Showing: Expired + 7 days + 30 days"}
          {win === "90" && "Showing: Expired + 7 days + 30 days + 90 days"}
          {win === "all" && "Showing all urgent"}
        </span>
      </div>

      {/* ALERT LIST */}
      {filtered.length === 0 ? (
        <div className="p-2 text-sm text-gray-500">
          No upcoming renewals in this window.
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((c) => {
            const date = c.renewalDate
              ? new Date(c.renewalDate).toISOString().slice(0, 10)
              : "—";
            return (
              <li
                key={c.id}
                className="rounded-md border p-3 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: colors[c.bucket] }}
                  title={LABELS[c.bucket]}
                />
                <Link
                  href={`/contracts/${c.id}`}
                  className="text-blue-600 hover:underline"
                >
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
