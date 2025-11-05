import "../globals.css";
import Sidebar from "@/components/Sidebar";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Bar (fixed, spans over sidebar) */}
      <header className="fixed top-0 left-0 right-0 z-40 h-20 border-b border-border bg-white/90 backdrop-blur-md shadow-sm flex items-center justify-between px-8">
        {/* Left: Logo */}
        <div className="flex items-center">
          <Image
            src="/brand/Oviu-logo.png"
            alt="OVIU"
            width={115}
            height={36}
            className="object-contain"
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

          <UserButton afterSignOutUrl="/login" />
        </div>
      </header>

      {/* Layout below the fixed header */}
      <div className="flex flex-1 pt-20">
        {/* Sidebar (starts below the header, professional spacing) */}
        <aside className="sticky top-20 h-[calc(100vh-5rem)] w-56 shrink-0 border-r border-border bg-sidebar text-sidebar-foreground">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-[var(--muted)]/60">
          <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
