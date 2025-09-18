// src/app/(app)/settings/company/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";

const MAX_MB = 5;
const ACCEPT =
  "image/png,image/jpeg,image/webp,image/svg+xml";

export default function CompanySettingsPage() {
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);

  // Load current settings
  useEffect(() => {
    // company name
    fetch("/api/settings/company")
      .then((r) => r.json())
      .then((j) => j?.ok && setCompanyName(j.companyName || ""))
      .catch(() => {});

    // logo
    fetch("/api/settings/logo")
      .then((r) => r.json())
      .then((j) => j?.ok && setLogoUrl(j.logoUrl || null))
      .catch(() => {});
  }, []);

  async function saveName() {
    if (!companyName?.trim()) {
      alert("Please enter a company name.");
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch("/api/settings/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: companyName.trim() }),
      });
      const text = await res.text();
      let j: any = null;
      try { j = JSON.parse(text); } catch {}
      if (!res.ok || !j?.ok) throw new Error(j?.error || `${res.status} ${res.statusText}`);
      alert("Saved!");
    } catch (e: any) {
      alert(e?.message || "Save failed");
    } finally {
      setSavingName(false);
    }
  }

  async function uploadLogo(file: File) {
    // Client-side validation
    if (!ACCEPT.split(",").includes(file.type)) {
      alert(`Unsupported file type: ${file.type}`);
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`File too large. Max ${MAX_MB} MB.`);
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/settings/logo", { method: "POST", body: fd });

      const text = await res.text();
      let j: any = null;
      try { j = JSON.parse(text); } catch {}
      if (!res.ok || !j?.ok) {
        throw new Error(j?.error || `${res.status} ${res.statusText}`);
      }
      setLogoUrl(j.logoUrl);
    } catch (e: any) {
      alert(e?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeLogo() {
    if (!logoUrl) return;
    if (!confirm("Remove your logo?")) return;

    setRemoving(true);
    try {
      const res = await fetch("/api/settings/logo", { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || res.statusText);
      setLogoUrl(null);
    } catch (e: any) {
      alert(e?.message || "Remove failed");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="text-sm text-slate-500">Settings</div>
        <h1 className="mt-1 text-2xl font-semibold">Company</h1>
      </div>

      <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-4">
        {/* Company name */}
        <div>
          <label className="block text-xs font-semibold text-slate-600">
            Company name
          </label>
          <div className="mt-1 flex gap-2">
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              className="w-80 rounded border px-3 py-2 text-sm"
              placeholder="e.g., ABC Software LLC"
            />
            <button
              onClick={saveName}
              disabled={savingName}
              className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
            >
              {savingName ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {/* Logo */}
        <div>
          <label className="block text-xs font-semibold text-slate-600">Logo</label>

          <div className="mt-2 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded bg-slate-100 ring-1 ring-slate-200">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="logo" className="h-full w-full object-contain" />
              ) : (
                <span className="text-xs text-slate-400">No logo</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer underline underline-offset-4 text-sm text-slate-900 hover:opacity-80"
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "Choose file"}
            </button>

            {logoUrl && (
              <button
                type="button"
                onClick={removeLogo}
                className="text-sm text-red-600 hover:text-red-700"
                disabled={removing}
              >
                {removing ? "Removing…" : "Remove"}
              </button>
            )}

            <input
              ref={fileRef}
              hidden
              type="file"
              accept={ACCEPT}
              onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
            />
          </div>

          <p className="mt-2 text-xs text-slate-500">
            PNG/JPG/SVG/WebP up to {MAX_MB} MB.
          </p>
        </div>
      </div>
    </div>
  );
}
