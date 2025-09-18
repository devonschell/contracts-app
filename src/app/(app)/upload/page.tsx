"use client";

import { useCallback, useMemo, useRef, useState } from "react";

type QueueItem = {
  file: File;
  sizeLabel: string;
  status: "idle" | "uploading" | "done" | "error";
  progress: number;
  message?: string;
};

export default function UploadPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onFilesChosen = useCallback((files: FileList | null) => {
    if (!files || !files[0]) return;
    const f = files[0];
    setQueue([
      {
        file: f,
        sizeLabel: humanFileSize(f.size),
        status: "idle",
        progress: 0,
      },
    ]);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onFilesChosen(e.dataTransfer.files);
    },
    [onFilesChosen]
  );

  const doBrowse = () => inputRef.current?.click();
  const uploading = useMemo(() => queue.some((q) => q.status === "uploading"), [queue]);

  const startUpload = async () => {
    if (!queue[0]) return alert("Choose a contract file first.");
    const current = queue[0];
    updateQueue(0, {
      status: "uploading",
      progress: 8,
      message: `Creating contract for “${current.file.name}”...`,
    });

    try {
      // 1) create a new contract
      const newRes = await fetch("/api/contracts/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const newJson = await newRes.json();
      if (!newRes.ok || !newJson?.id) {
        const reason = newJson?.error || "Could not create contract";
        throw new Error(reason);
      }
      const contractId: string = newJson.id;

      // 2) upload the file to /api/upload (must include 'file' and 'contractId')
      updateQueue(0, { message: "Uploading file…" });

      const form = new FormData();
      form.append("file", current.file); // field name must be 'file'
      form.append("contractId", contractId);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload", true);

      xhr.upload.onprogress = (evt) => {
        if (!evt.lengthComputable) return;
        const pct = Math.min(95, Math.round((evt.loaded / evt.total) * 100));
        updateQueue(0, { progress: pct });
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState !== XMLHttpRequest.DONE) return;
        try {
          const json = JSON.parse(xhr.responseText || "{}");
          if (xhr.status >= 200 && xhr.status < 300 && json?.ok) {
            updateQueue(0, { status: "done", progress: 100, message: "Upload complete." });
            window.location.href = `/contracts/${contractId}`;
          } else {
            const reason = json?.error || json?.message || "Unknown error";
            updateQueue(0, { status: "error", message: `Upload failed: ${reason}` });
            alert(`Upload failed: ${reason}`);
          }
        } catch {
          updateQueue(0, { status: "error", message: "Bad response from server." });
          alert("Upload failed: bad response from server.");
        }
      };

      xhr.onerror = () => {
        updateQueue(0, { status: "error", message: "Network error." });
        alert("Upload failed: network error.");
      };

      xhr.send(form);
    } catch (err: any) {
      updateQueue(0, { status: "error", message: err?.message || "Upload failed." });
      alert(`Upload failed: ${err?.message || "reason unknown"}`);
    }
  };

  function updateQueue(index: number, patch: Partial<QueueItem>) {
    setQueue((q) => {
      const copy = [...q];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      {/* Top header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            Contract Intelligence
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Drag & drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDrop={onDrop}
          className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-10 text-center text-slate-600"
        >
          <p className="mb-2 text-base font-medium">
            Drag &amp; drop contracts here (PDF/DOCX), or{" "}
            <button onClick={doBrowse} className="underline underline-offset-4 hover:no-underline">
              browse
            </button>
          </p>
          <p className="text-sm opacity-80">
            We’ll extract text, auto-fill key fields, and generate a summary.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => onFilesChosen(e.target.files)}
          />
        </div>

        {/* Upload queue */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">Upload queue</h2>
          </div>

        <div className="px-4 py-4">
            {queue.length === 0 ? (
              <p className="text-sm text-slate-500">No file selected.</p>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-900">{queue[0].file.name}</div>
                  <div className="text-xs text-slate-500">{queue[0].sizeLabel}</div>
                  <div className="mt-3 h-2 w-64 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-slate-800 transition-all"
                      style={{ width: `${queue[0].progress}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-slate-600">{statusLabel(queue[0])}</div>
                </div>

                <button
                  onClick={startUpload}
                  disabled={uploading || queue[0].status === "done"}
                  className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? "Uploading..." : "Upload & Create"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function humanFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = (bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1);
  return `${val} ${sizes[i]}`;
}

function statusLabel(item: QueueItem) {
  if (item.status === "idle") return "Ready to upload.";
  if (item.status === "uploading") return `Uploading… ${item.progress}%`;
  if (item.status === "done") return "Upload complete.";
  if (item.status === "error") return item.message || "Upload failed.";
  return "";
}
