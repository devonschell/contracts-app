// src/app/(app)/layout.tsx (or wherever your AppLayout lives)
import "../globals.css";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex">
        <aside className="w-[220px] border-r bg-white">
          <Sidebar />
        </aside>

        <main className="flex-1">
          <Topbar />
          {/* Wider horizontal padding prevents the visual “hug” to the rail */}
          <div className="px-8 py-6">
            <div className="mx-auto max-w-6xl">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
