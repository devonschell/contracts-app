import "../globals.css";
import Sidebar from "@/components/Sidebar";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="sticky top-0 h-screen w-56 shrink-0 border-r border-border bg-sidebar text-sidebar-foreground z-10">
        <Sidebar />
      </aside>

      {/* Main area */}
      <main className="flex-1 bg-[var(--muted)]/60 relative">
        {/* Content clears the header height */}
        <div className="pt-[72px] mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>

      {/* Top Bar: spans full width (over sidebar), a bit taller for the logo */}
      <header className="absolute top-0 left-0 right-0 h-[72px] border-b border-border bg-white/90 backdrop-blur-md z-20 flex items-center justify-between px-8 shadow-sm">
        {/* Left: OVIU logo (slight overlap into sidebar) */}
        <div className="flex items-center">
          <Image
            src="/brand/Oviu-logo.png"
            alt="OVIU"
            width={108}
            height={32}
            className="object-contain relative left-[36px]"
            priority
          />
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

          {/* Only Clerk avatar lives here (removing any others elsewhere) */}
          <UserButton afterSignOutUrl="/login" />
        </div>
      </header>
    </div>
  );
}
