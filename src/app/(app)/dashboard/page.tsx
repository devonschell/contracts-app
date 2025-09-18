// src/app/(app)/dashboard/page.tsx
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import DashboardPie, { type PieDatum } from "@/components/DashboardPie";
import DashboardAlerts, { type AlertItem } from "@/components/DashboardAlerts";

export const dynamic = "force-dynamic";

// Urgent buckets we care about
type Cat = "expired" | "7" | "30" | "90";

const COLORS: Record<Cat, string> = {
  expired: "#ef4444", // red
  "7": "#f87171",     // light red
  "30": "#f59e0b",    // amber
  "90": "#10b981",    // green
};

function categoryFor(date: Date | null): Cat | null {
  if (!date) return null;
  const today = new Date();
  const d0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((+d1 - +d0) / 86400000);

  if (days < 0) return "expired";
  if (days <= 7) return "7";
  if (days <= 30) return "30";
  if (days <= 90) return "90";
  return null; // >90d → not urgent
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const contracts = await prisma.contract.findMany({
    where: { clerkUserId: userId, deletedAt: null }, // hide soft-deleted
    orderBy: { renewalDate: "asc" },
    include: { uploads: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  // Count urgent buckets for the pie + build alert items for the component
  let expired = 0, due7 = 0, due30 = 0, due90 = 0;

  const alertItems: AlertItem[] = contracts
    .map((c) => {
      const cat = categoryFor(c.renewalDate ? new Date(c.renewalDate) : null);
      if (cat === "expired") expired += 1;
      else if (cat === "7") due7 += 1;
      else if (cat === "30") due30 += 1;
      else if (cat === "90") due90 += 1;

      if (!cat) return null;
      return {
        id: c.id,
        title: c.title,
        counterparty: c.counterparty,
        renewalDate: c.renewalDate ?? null,
        bucket: cat, // "expired" | "7" | "30" | "90"
      } satisfies AlertItem;
    })
    .filter(Boolean) as AlertItem[];

  // Pie shows only urgent slices (non-zero)
  const pieData: PieDatum[] = [
    { name: "Expired", value: expired, color: COLORS.expired },
    { name: "7 days",  value: due7,    color: COLORS["7"] },
    { name: "30 days", value: due30,   color: COLORS["30"] },
    { name: "90 days", value: due90,   color: COLORS["90"] },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Pie + legend */}
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-medium mb-2">Renewal Risk Mix</div>
          <DashboardPie data={pieData} />
          <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: COLORS.expired }} />
              <span>Expired</span>
              <span className="ml-auto">{expired}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: COLORS["7"] }} />
              <span>7 days</span>
              <span className="ml-auto">{due7}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: COLORS["30"] }} />
              <span>30 days</span>
              <span className="ml-auto">{due30}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: COLORS["90"] }} />
              <span>90 days</span>
              <span className="ml-auto">{due90}</span>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-medium mb-2">Totals</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border p-3">
              <div className="text-gray-500">Contracts</div>
              <div className="text-xl font-semibold">{contracts.length}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-gray-500">30 days</div>
              <div className="text-xl font-semibold">{expired + due7 + due30}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-gray-500">60 days</div>
              <div className="text-xl font-semibold">
                {expired + due7 + due30 + Math.min(due90, Math.max(0, due90))}
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-gray-500">90 days</div>
              <div className="text-xl font-semibold">
                {expired + due7 + due30 + due90}
              </div>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-medium mb-2">Quick Links</div>
          <ul className="text-sm space-y-2">
            <li><Link href="/contracts" className="underline">View all contracts</Link></li>
            <li><Link href="/upload" className="underline">Upload new contract</Link></li>
            <li><Link href="/settings" className="underline">Notification settings</Link></li>
          </ul>
        </div>
      </div>

      {/* Alerts with interactive filters */}
      <DashboardAlerts items={alertItems} colors={COLORS} defaultWindow="30" />
    </div>
  );
}
