import "../globals.css";
import Sidebar from "@/components/Sidebar";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar — fixed, spans across the whole app (including over the sidebar) */}
      <header className="fixed top-0 left-0 right-0 z-30 h-16 border-b border-border bg-white/90 backdrop-blur-md shadow-sm">
        <div className="h-full flex items-center justify-between px-6">
          {/* Left: Make space for sidebar, then overlap the logo slightly */}
          <div className="flex items-center pl-14"> {/* 14 * 4px = 56px (sidebar width) */}
            <div className="-ml-2"> {/* small overlap into sidebar */}
              <Image
                src="/brand/Oviu-logo.png"
                alt="OVIU"
                width={106}
                height={32}
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Right: Notifications + Clerk avatar */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Notifications"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="h-5 w-5 text-slate-600"
                strokeWidth="2"
              >
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.054-.595 1.436L4 17h5" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 inline-block h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
            </button>

            {/* Only Clerk avatar lives here */}
            <UserButton afterSignOutUrl="/login" />
          </div>
        </div>
      </header>

      <div className="flex pt-16"> {/* push content below the fixed header */}
        {/* Sidebar (tightened) */}
        <aside className="sticky top-16 h-[calc(100vh-4rem)] w-56 shrink-0 border-r border-border bg-sidebar text-sidebar-foreground">
          <Sidebar />
        </aside>

        {/* Main */}
        <main className="flex-1 bg-[var(--muted)]/60">
          <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
