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
      <main className="flex-1 px-10 py-8 bg-background">
        <div className="space-y-8">{children}</div>
      </main>
    </div>
  );
}
