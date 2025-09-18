// src/components/AppLogo.tsx
"use client";

import { useEffect, useState } from "react";

export default function AppLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/settings/company", { cache: "no-store" });
      const j = await res.json();
      if (j?.ok) setLogoUrl(j.logoUrl || null);
    } catch {}
  }

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener("company-logo-updated", onUpdate);
    return () => window.removeEventListener("company-logo-updated", onUpdate);
  }, []);

  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt="Company logo" className="h-6 w-auto object-contain" />;
  }
  return <span className="font-semibold">YourLogo</span>;
}
