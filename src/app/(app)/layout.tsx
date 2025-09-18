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
          <div className="mx-auto max-w-6xl p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
