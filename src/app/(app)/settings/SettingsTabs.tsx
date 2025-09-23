"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/notifications", label: "Notifications" },
  { href: "/settings/billing", label: "Billing" },
];

export default function SettingsTabs() {
  const pathname = usePathname() || "/settings";

  // Hide the tab bar on the landing page so users only see the card menu
  const isRoot = pathname === "/settings" || pathname === "/settings/";
  if (isRoot) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {TABS.map((t) => {
        const active =
          pathname === t.href || pathname.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              active
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
