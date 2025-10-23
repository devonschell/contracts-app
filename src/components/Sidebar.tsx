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
      <div className="p-4">
        <Link href="/" className="inline-block select-none no-underline">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            ClauseIQ
          </span>
        </Link>
      </div>

      <nav className="flex flex-col gap-1 p-2">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                // base
                "relative rounded-md px-3 py-2 text-sm transition-colors no-underline",
                "text-gray-700 hover:bg-gray-100 hover:text-black",
                // active (no blue fill; left indicator + bolder text)
                active &&
                  "font-semibold text-black bg-transparent after:absolute after:left-0 after:top-1.5 after:bottom-1.5 after:w-1 after:rounded-full after:bg-blue-500"
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
