"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export type PieDatum = { name: string; value: number; color: string };

export default function DashboardPie({ data }: { data: PieDatum[] }) {
  if (!data?.length) {
    return (
      <div className="h-48 grid place-items-center text-sm text-gray-500">
        No data
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const nonZero = data.filter((d) => d.value > 0);

  // If only one slice, use a brand gradient so it doesn't feel like an error state
  const single = nonZero.length === 1;

  return (
    <div className="h-56 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {/* subtle base ring gradient */}
            <radialGradient id="oviu-base" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f1f5f9" stopOpacity="1" />
              <stop offset="100%" stopColor="#e2e8f0" stopOpacity="1" />
            </radialGradient>

            {/* brand gradient for single-slice case (blue -> violet) */}
            <linearGradient id="oviu-brand" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5B7CFF" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>

            {/* per-slice radial gradients to add depth without cheesy 3D */}
            {data.map((d, i) => (
              <radialGradient key={i} id={`oviu-slice-${i}`} cx="50%" cy="40%" r="75%">
                <stop offset="0%" stopColor={d.color} stopOpacity={0.95} />
                <stop offset="100%" stopColor={d.color} stopOpacity={0.65} />
              </radialGradient>
            ))}
          </defs>

          {/* Base ring for polish */}
          <Pie
            data={[{ name: "base", value: 1 }]}
            dataKey="value"
            innerRadius={60}
            outerRadius={90}
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill="url(#oviu-base)" />
          </Pie>

          {/* Actual data on top */}
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={88}
            paddingAngle={2}
            stroke="none"
            isAnimationActive
          >
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={single ? "url(#oviu-brand)" : `url(#oviu-slice-${i})`}
                style={{ filter: "drop-shadow(0px 1px 3px rgba(0,0,0,0.06))" }}
              />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              fontSize: "0.85rem",
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-2xl font-semibold text-foreground">{total}</div>
        <div className="text-xs text-muted-foreground">Total</div>
      </div>
    </div>
  );
}
