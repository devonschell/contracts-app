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

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={80}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
