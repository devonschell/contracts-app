"use client";
import { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";

type Alert = {
  id: string;
  title: string;
  dueInDays: number;
  type: "renewal" | "price" | "other";
};

const sampleAlerts: Alert[] = [
  { id: "a1", title: "Acme MSA renewal",        dueInDays: 5,  type: "renewal" },
  { id: "a2", title: "Globex price increase 4%", dueInDays: 28, type: "price"   },
  { id: "a3", title: "Umbrella data addendum",   dueInDays: 45, type: "other"   },
  { id: "a4", title: "Wayne SLA renegotiation",  dueInDays: 72, type: "renewal" },
];

const rangeTabs = [
  { key: "week", label: "This Week", max: 7 },
  { key: "30",  label: "30d",        max: 30 },
  { key: "60",  label: "60d",        max: 60 },
  { key: "90",  label: "90d",        max: 90 },
] as const;

// urgency colors
const URGENCY_COLORS = {
  red:   "#ef4444", // due <= 7
  amber: "#f59e0b", // 8..30
  green: "#10b981", // 31..range.max
} as const;

export default function DashboardPage() {
  const [range, setRange] = useState<(typeof rangeTabs)[number]>(rangeTabs[0]);

  // Alerts inside selected window
  const windowAlerts = useMemo(
    () => sampleAlerts.filter(a => a.dueInDays <= range.max),
    [range]
  );

  // Line chart: cumulative count at each window
  const chartData = [
    { label: "This Week", count: sampleAlerts.filter(a => a.dueInDays <= 7).length },
    { label: "30d",       count: sampleAlerts.filter(a => a.dueInDays <= 30).length },
    { label: "60d",       count: sampleAlerts.filter(a => a.dueInDays <= 60).length },
    { label: "90d",       count: sampleAlerts.filter(a => a.dueInDays <= 90).length },
  ];

  // Pie chart: urgency distribution within selected window
  const urgencyBuckets = windowAlerts.reduce(
    (acc, a) => {
      if (a.dueInDays <= 7) acc.red++;
      else if (a.dueInDays <= 30) acc.amber++;
      else acc.green++;
      return acc;
    },
    { red: 0, amber: 0, green: 0 }
  );
  const pieData = [
    { name: "Due ≤ 7d", value: urgencyBuckets.red,   color: URGENCY_COLORS.red },
    { name: "8–30d",    value: urgencyBuckets.amber, color: URGENCY_COLORS.amber },
    { name: "31–90d",   value: urgencyBuckets.green, color: URGENCY_COLORS.green },
  ];

  // Table list, sorted soonest first within the window
  const filtered = useMemo(
    () => windowAlerts.slice().sort((a, b) => a.dueInDays - b.dueInDays),
    [windowAlerts]
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Line: Coming up counts */}
        <div className="rounded-lg border bg-white p-4 h-72">
          <div className="mb-2 text-sm font-medium">Contracts Coming Up</div>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie: Urgency breakdown (red/yellow/green) */}
        <div className="rounded-lg border bg-white p-4 h-72">
          <div className="mb-2 text-sm font-medium">Urgency Breakdown</div>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Tooltip />
              <Legend verticalAlign="bottom" height={24} />
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius="80%">
                {pieData.map((slice, i) => (
                  <Cell key={i} fill={slice.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts list with range tabs */}
      <div className="rounded-lg border bg-white p-4">
        <div className="flex gap-2 pb-3">
          {rangeTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setRange(t)}
              className={`rounded-md border px-3 py-1 text-sm ${range.key === t.key ? "bg-gray-100" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <ul className="space-y-2">
          {filtered.map((a) => {
            const color =
              a.dueInDays <= 7 ? URGENCY_COLORS.red :
              a.dueInDays <= 30 ? URGENCY_COLORS.amber :
              URGENCY_COLORS.green;
            return (
              <li key={a.id} className="rounded-md border p-3 text-sm flex items-center justify-between">
                <span>{a.title}</span>
                <span className="text-xs" style={{ color }}>{a.dueInDays}d</span>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="rounded-md border p-3 text-sm text-gray-500">No alerts in this window.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
