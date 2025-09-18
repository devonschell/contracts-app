// src/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppLogo from "@/components/AppLogo";

type Item = { href: string; label: string };

const MAIN: Item[] = [
  { href: "/contracts", label: "Contracts" },
  { href: "/upload",    label: "Upload" },
  { href: "/settings",  label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen w-60 border-r bg-white">
      {/* Brand */}
      <div className="flex h-14 items-center px-4">
        <Link
          href="/contracts"
          className="flex items-center gap-2 cursor-pointer"
          aria-label="Go to home"
        >
          <AppLogo />
        </Link>
      </div>

      {/* Nav */}
      <nav className="mt-2 space-y-1 px-2">
        {MAIN.map((it) => (
          <NavLink key={it.href} href={it.href} active={isActive(pathname, it.href)}>
            {it.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  const base =
    "block rounded-md px-3 py-2 text-sm transition-colors cursor-pointer";
  const activeCls = "bg-black text-white";
  const idleCls = "text-slate-700 hover:bg-slate-100";
  return (
    <Link href={href} className={`${base} ${active ? activeCls : idleCls}`}>
      {children}
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  // mark active for the section root or any sub-route
  return pathname === href || pathname.startsWith(href + "/");
}
