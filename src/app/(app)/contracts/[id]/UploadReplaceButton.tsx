"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Inline replace: opens Finder, POSTs to /api/upload (override=true),
 * refreshes the page. No navigation.
 */
export default function UploadReplaceButton({ contractId }: { contractId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const uid = useId();

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      const fd = new FormData();
      fd.append("files", file);
      fd.append("contractId", contractId);
      fd.append("override", "true");
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Upload failed (${res.status})`);
      router.refresh();
    } catch (err: any) {
      alert(err?.message || "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="inline-flex" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <input
        id={`inline-replace-${uid}`}
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={onPick}
      />
      <button
        type="button"
        className="cursor-pointer rounded-md bg-black px-3 py-2 text-white text-sm disabled:opacity-60"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Uploading…" : "Upload new version"}
      </button>
    </div>
  );
}
