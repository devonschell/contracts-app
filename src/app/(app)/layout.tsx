// src/app/(app)/layout.tsx
import "../globals.css";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Fixed, full-height sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 border-r bg-white">
        <Sidebar />
      </aside>

      {/* Main rail (pushed over by sidebar width) */}
      <div className="ml-64 flex min-h-screen flex-col">
        <Topbar />
        <main className="mx-auto w-full max-w-7xl px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
