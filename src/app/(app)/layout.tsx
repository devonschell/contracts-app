import "../globals.css";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="sticky top-0 h-screen w-64 shrink-0 border-r border-border bg-sidebar text-sidebar-foreground">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-[var(--muted)]/60">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
