"use client";
import { useMemo, useState } from "react";

type Row = { id: string; counterparty: string; contract: string; status: string; renewal: string; alerts: number };
const rows: Row[] = [
  { id: "1", counterparty: "Acme Co.", contract: "MSA", status: "Active", renewal: "2025-01-31", alerts: 2 },
  { id: "2", counterparty: "Globex", contract: "SaaS Order", status: "Active", renewal: "2025-03-15", alerts: 1 },
  { id: "3", counterparty: "Umbrella", contract: "DPA", status: "Review", renewal: "2025-02-10", alerts: 0 },
];

export default function ContractsPage() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return rows.filter(r =>
      [r.counterparty, r.contract, r.status, r.renewal].some(v => v.toLowerCase().includes(s))
    );
  }, [q]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Contracts</h1>

      <input
        className="w-full rounded-md border px-3 py-2 text-sm"
        placeholder="Search contracts..."
        value={q}
        onChange={e => setQ(e.target.value)}
      />

      <div className="rounded-lg border bg-white">
        <div className="grid grid-cols-5 gap-2 border-b p-3 text-xs font-medium text-gray-600">
          <div>Counterparty</div><div>Contract</div><div>Status</div><div>Renewal</div><div>Alerts</div>
        </div>
        {filtered.map(r => (
          <div key={r.id} className="grid grid-cols-5 gap-2 p-3 text-sm hover:bg-gray-50 cursor-pointer">
            <div>{r.counterparty}</div><div>{r.contract}</div><div>{r.status}</div><div>{r.renewal}</div><div>{r.alerts}</div>
          </div>
        ))}
        {filtered.length === 0 && <div className="p-4 text-sm text-gray-500">No results.</div>}
      </div>
    </div>
  );
}
