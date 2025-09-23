// src/app/(app)/layout.tsx
import "../globals.css";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <div className="flex min-h-dvh">
        {/* Left rail */}
        <aside className="sticky top-0 h-dvh w-60 shrink-0 border-r bg-white">
          <Sidebar />
        </aside>

        {/* Main column */}
        <main className="min-w-0 flex-1">
          <Topbar />
          <div className="px-8 py-6">
            <div className="mx-auto max-w-6xl">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
