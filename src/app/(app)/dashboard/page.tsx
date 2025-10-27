import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import DashboardPie, { type PieDatum } from "@/components/DashboardPie";
import DashboardAlerts, { type AlertItem } from "@/components/DashboardAlerts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import PageContainer from "@/components/PageContainer";

export const dynamic = "force-dynamic";

type Cat = "expired" | "7" | "30" | "90";

const COLORS: Record<Cat, string> = {
  expired: "#ef4444",
  "7": "#f87171",
  "30": "#f59e0b",
  "90": "#10b981",
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
  return null;
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const contracts = await prisma.contract.findMany({
    where: { clerkUserId: userId, deletedAt: null },
    orderBy: { renewalDate: "asc" },
    include: { uploads: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

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
        bucket: cat,
      } satisfies AlertItem;
    })
    .filter(Boolean) as AlertItem[];

  const pieData: PieDatum[] = [
    { name: "Expired", value: expired, color: COLORS.expired },
    { name: "7 days", value: due7, color: COLORS["7"] },
    { name: "30 days", value: due30, color: COLORS["30"] },
    { name: "90 days", value: due90, color: COLORS["90"] },
  ].filter((d) => d.value > 0);

  return (
    <PageContainer
      title="Dashboard"
      description="Overview of your contracts, renewals, and alerts."
    >
      <div className="card-grid">
        {/* Renewal Risk Mix */}
        <Card>
          <CardHeader>
            <CardTitle>Renewal Risk Mix</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardPie data={pieData} />
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              {[
                { label: "Expired", color: COLORS.expired, count: expired },
                { label: "7 days", color: COLORS["7"], count: due7 },
                { label: "30 days", color: COLORS["30"], count: due30 },
                { label: "90 days", color: COLORS["90"], count: due90 },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.label}</span>
                  <span className="ml-auto">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardHeader>
            <CardTitle>Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Contracts", value: contracts.length },
                { label: "30 days", value: expired + due7 + due30 },
                { label: "60 days", value: expired + due7 + due30 + due90 },
                { label: "90 days", value: expired + due7 + due30 + due90 },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-md border border-border bg-background p-3"
                >
                  <div className="text-muted-foreground">{item.label}</div>
                  <div className="text-xl font-semibold text-foreground">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts now contain the search + button */}
      <DashboardAlerts items={alertItems} colors={COLORS} defaultWindow="30" />
    </PageContainer>
  );
}
