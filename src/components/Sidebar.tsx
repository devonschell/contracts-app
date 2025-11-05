"use client";

import Link from "next/link";
import Image from "next/image";
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
      {/* Brand */}
      <div className="px-4 py-3 flex items-center justify-center border-b border-sidebar-border">
        <Link href="/" className="inline-block select-none no-underline">
          <Image
            src="/brand/oviu-logo@2x.png"
            alt="OVIU"
            width={100}
            height={28}
            className="mx-auto object-contain"
            priority
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-[2px] p-2 mt-2">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "relative rounded-md px-3 py-2 text-sm transition-all no-underline flex items-center",
                "text-gray-700 hover:text-[var(--primary)] hover:bg-[rgba(107,91,255,0.08)]",
                active &&
                  "font-semibold text-[var(--primary)] bg-[rgba(107,91,255,0.08)] after:absolute after:left-0 after:top-1.5 after:bottom-1.5 after:w-1 after:rounded-full after:bg-[var(--primary)]"
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
