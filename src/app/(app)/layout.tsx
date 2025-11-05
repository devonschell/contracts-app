import "../globals.css";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar (tightened) */}
      <aside className="sticky top-0 h-screen w-56 shrink-0 border-r border-border bg-sidebar text-sidebar-foreground">
        <Sidebar />
      </aside>

      {/* Main */}
      <main className="flex-1 bg-[var(--muted)]/60">
        {/* Mini top-right bar */}
        <header className="sticky top-0 z-30 h-14 border-b border-border bg-white/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-end gap-4">
            {/* Notification bell */}
            <button
              type="button"
              aria-label="Notifications"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition"
            >
              {/* simple bell svg, no extra deps */}
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
              {/* unread dot (optional) */}
              <span className="absolute -top-0.5 -right-0.5 inline-block h-2.5 w-2.5 rounded-full bg-[var(--primary)]"></span>
            </button>

            {/* Avatar placeholder */}
            <div
              className="h-9 w-9 rounded-full bg-[var(--primary)] text-white grid place-items-center text-sm font-semibold select-none"
              title="Account"
            >
              D
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
