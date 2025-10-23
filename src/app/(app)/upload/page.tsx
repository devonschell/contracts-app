"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import PageContainer from "@/components/PageContainer";

type QueueItem = {
  file: File;
  sizeLabel: string;
  status: "idle" | "uploading" | "done" | "error";
  progress: number;
  message?: string;
  contractId?: string;
};

export default function UploadPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onFilesChosen = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const items: QueueItem[] = Array.from(files).map((f) => ({
      file: f,
      sizeLabel: humanFileSize(f.size),
      status: "idle",
      progress: 0,
    }));
    setQueue(items);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;
      onFilesChosen(files);
    },
    [onFilesChosen]
  );

  const doBrowse = () => inputRef.current?.click();
  const uploading = useMemo(() => queue.some((q) => q.status === "uploading"), [queue]);

  const startUploadAll = async () => {
    if (queue.length === 0) return alert("Choose one or more contract files first.");

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status === "done") continue;

      updateQueue(i, {
        status: "uploading",
        progress: 6,
        message: `Uploading “${item.file.name}”…`,
      });

      try {
        const form = new FormData();
        form.append("file", item.file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload", true);

        xhr.upload.onprogress = (evt) => {
          if (!evt.lengthComputable) return;
          const pct = Math.min(95, Math.round((evt.loaded / evt.total) * 100));
          updateQueue(i, { progress: pct });
        };

        const done = () => {
          try {
            const json = JSON.parse(xhr.responseText || "{}");
            if (xhr.status >= 200 && xhr.status < 300 && json?.ok) {
              updateQueue(i, {
                status: "done",
                progress: 100,
                message: "Upload complete.",
                contractId: json.contractId,
              });
            } else {
              const reason = json?.error || json?.message || "Unknown error";
              updateQueue(i, { status: "error", message: `Upload failed: ${reason}` });
            }
          } catch {
            updateQueue(i, { status: "error", message: "Bad response from server." });
          }
        };

        await new Promise<void>((resolve) => {
          xhr.onreadystatechange = () => {
            if (xhr.readyState !== XMLHttpRequest.DONE) return;
            done();
            resolve();
          };
          xhr.onerror = () => {
            updateQueue(i, { status: "error", message: "Network error." });
            resolve();
          };
          xhr.send(form);
        });
      } catch (err: any) {
        updateQueue(i, { status: "error", message: err?.message || "Upload failed." });
      }
    }

    window.location.href = "/contracts";
  };

  function updateQueue(index: number, patch: Partial<QueueItem>) {
    setQueue((q) => {
      const copy = [...q];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  }

  return (
    <PageContainer
      title="Upload Contracts"
      description="Add new contracts to ClauseIQ for analysis and tracking."
    >
      {/* Drag & drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={onDrop}
        className="rounded-xl border-2 border-dashed border-border bg-card p-10 text-center text-muted-foreground"
      >
        <p className="mb-2 text-base font-medium text-foreground">
          Drag &amp; drop contracts here (PDF/DOCX), or{" "}
          <button
            onClick={doBrowse}
            className="text-primary underline underline-offset-4 hover:no-underline"
          >
            browse
          </button>
        </p>
        <p className="text-sm opacity-80">Drop multiple files to import in a batch.</p>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={(e) => onFilesChosen(e.target.files)}
        />
      </div>

      {/* Upload queue */}
      <div className="mt-8 rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Upload Queue</h2>
        </div>

        <div className="px-4 py-4 space-y-4">
          {queue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No files selected.</p>
          ) : (
            <>
              {queue.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">
                      {item.file.name}
                    </div>
                    <div className="text-xs text-muted-foreground">{item.sizeLabel}</div>
                    <div className="mt-3 h-2 w-64 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          item.status === "error"
                            ? "bg-destructive"
                            : "bg-primary"
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {statusLabel(item)}
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <button
                  onClick={startUploadAll}
                  disabled={uploading || queue.every((q) => q.status === "done")}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? "Uploading..." : "Upload & Create"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </PageContainer>
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
