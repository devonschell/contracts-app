"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadReplaceButton({ contractId }: { contractId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const uid = useId();

  const safeRefresh = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("r", String(Date.now())); // cache-buster
      // Use router.replace instead of router.refresh to avoid the dev manifest bug
      router.replace(url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : ""));
    } catch {
      // absolute fallback
      window.location.assign(window.location.href);
    }
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      const fd = new FormData();
      fd.append("files", file);           // keep your existing field name
      fd.append("contractId", contractId);
      fd.append("override", "true");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      let text = "";
      try { text = await res.text(); } catch {}

      let json: any = {};
      try { json = text ? JSON.parse(text) : {}; } catch {}

      if (!res.ok || !json?.ok) {
        const msg = json?.error || text || `Upload failed (${res.status})`;
        throw new Error(msg);
      }

      // ⬇️ replaced the old router.refresh() with a safer navigation
      safeRefresh();
    } catch (err: any) {
      console.error("[ReplaceUploadButton] upload error:", err);
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
        accept=".pdf,.doc,.docx,.txt"
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
