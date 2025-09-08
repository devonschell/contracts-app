"use client";
import Link from "next/link";
import { useMemo, useState } from "react";

type Row = {
  id: string;
  counterparty: string;
  contract: string;
  status: string;
  renewal: string;
  alerts: number;
};

const rows: Row[] = [
  { id: "1", counterparty: "Acme Co.",  contract: "MSA",        status: "Active", renewal: "2025-01-31", alerts: 2 },
  { id: "2", counterparty: "Globex",    contract: "SaaS Order", status: "Active", renewal: "2025-03-15", alerts: 1 },
  { id: "3", counterparty: "Umbrella",  contract: "DPA",        status: "Review", renewal: "2025-02-10", alerts: 0 },
];

export default function ContractDetail({ params }: { params: { id: string } }) {
  const data = useMemo(
    () =>
      rows.find((r) => r.id === params.id) ?? {
        id: params.id,
        counterparty: "Unknown",
        contract: "",
        status: "",
        renewal: "",
        alerts: 0,
      },
    [params.id]
  );

  const [files, setFiles] = useState<File[]>([]);
  const [overrideOld, setOverrideOld] = useState(true);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const list = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...list]);
  };
  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setFiles((prev) => [...prev, ...list]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{data.counterparty}</h1>
          <p className="text-sm text-gray-600">
            {data.contract} • Status: {data.status}
          </p>
        </div>
        <Link href="/contracts" className="text-sm underline">
          Back to list
        </Link>
      </div>

      {/* AI Summary (placeholder) */}
      <div className="rounded-lg border bg-white p-4">
        <div className="mb-2 text-sm font-medium">AI Summary</div>
        <p className="text-sm text-gray-700">
          Key obligations and renewal notice windows summarized here. (Stub — we’ll connect real AI extraction.)
        </p>
      </div>

      {/* Key details */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-medium mb-1">Renewal</div>
          <div className="text-sm">{data.renewal || "—"}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-medium mb-1">Alerts</div>
          <div className="text-sm">{data.alerts}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-medium mb-1">Counterparty</div>
          <div className="text-sm">{data.counterparty}</div>
        </div>
      </div>

      {/* Upload New Year's Contract */}
      <div className="rounded-lg border bg-white p-4 space-y-3">
        <div className="text-sm font-medium">Upload New Year’s Contract</div>
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="rounded-md border-2 border-dashed p-6 text-center text-sm"
        >
          Drag & drop PDF/DOCX here or{" "}
          <label className="underline cursor-pointer">
            browse
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={onInput}
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={overrideOld}
            onChange={(e) => setOverrideOld(e.target.checked)}
          />
          Override the old contract after upload
        </label>

        {files.length > 0 && (
          <div className="rounded-md border p-3">
            <div className="text-sm font-medium mb-2">Selected files</div>
            <ul className="text-sm space-y-1">
              {files.map((f, i) => (
                <li key={i} className="flex justify-between">
                  <span className="truncate max-w-[70%]">{f.name}</span>
                  <span className="text-xs text-gray-500">
                    {Math.round(f.size / 1024)} KB
                  </span>
                </li>
              ))}
            </ul>
            <button
              className="mt-3 rounded-md bg-black px-3 py-2 text-white text-sm"
              onClick={() =>
                alert(
                  `Pretend-upload ${files.length} file(s); override=${overrideOld}`
                )
              }
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
