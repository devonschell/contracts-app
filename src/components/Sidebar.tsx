// src/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const nav = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Contracts", href: "/contracts" },
  { name: "Upload", href: "/upload" },
  { name: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
        sticky top-0 z-40
        h-[100dvh] w-64 shrink-0
        border-r border-border
        bg-sidebar text-[color:var(--sidebar-foreground)]
      "
    >
      <div className="p-4 text-lg font-semibold">YourLogo</div>
      <nav className="flex flex-col gap-1 p-2">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-[color:var(--sidebar-primary-foreground)]"
                  : "text-foreground/70 hover:bg-accent/10"
              )}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
