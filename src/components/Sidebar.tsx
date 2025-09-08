"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/contracts", label: "Contracts" },
  { href: "/upload", label: "Upload" },
  { href: "/settings", label: "Settings" },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r bg-white">
      <div className="p-4 text-xl font-semibold">YourLogo</div>
      <nav className="space-y-1 px-2 pb-4">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-md px-3 py-2 text-sm ${
              path?.startsWith(item.href)
                ? "bg-gray-100 font-medium"
                : "hover:bg-gray-50"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
