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
    <div className="h-full flex flex-col">
      {/* Lower the nav to clear the top bar visually */}
      <nav className="flex-1 flex flex-col gap-[2px] px-3 pt-[84px]">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "relative rounded-md px-3 py-2 text-sm transition-all no-underline flex items-center",
                "text-slate-700 hover:text-[var(--primary)] hover:bg-[rgba(107,91,255,0.06)]",
                active &&
                  [
                    "font-semibold text-slate-900",                       // bolder active label
                    "bg-[rgba(107,91,255,0.10)]",                         // slightly stronger active bg
                    "after:absolute after:left-0 after:top-1.5 after:bottom-1.5",
                    "after:w-1 after:rounded-full after:bg-[var(--primary)]", // vertical indicator bar
                  ].join(" ")
              )}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer / version */}
      <div className="px-3 py-4 text-[11px] text-slate-500 border-t border-sidebar-border">
        Oviu v0.1
      </div>
    </div>
  );
}
