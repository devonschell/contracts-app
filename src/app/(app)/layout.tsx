// src/app/(app)/layout.tsx
import "../globals.css";
import Sidebar from "@/components/Sidebar";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-40 h-20 border-b border-border bg-white/90 backdrop-blur-md shadow-sm flex items-center justify-between px-8">
        <div className="flex items-center">
          <Image
            src="/brand/oviu-logo.png"
            alt="OVIU"
            width={120}
            height={38}
            className="object-contain"
            priority
          />
        </div>

        {/* ⬇️ change afterSignOutUrl to "/" */}
        <UserButton afterSignOutUrl="/" />
      </header>

      <div className="flex flex-1 pt-20">
        <aside className="sticky top-20 h-[calc(100vh-5rem)] w-56 shrink-0 border-r border-border bg-sidebar">
          <Sidebar />
        </aside>

        <main className="flex-1 bg-[var(--muted)]/60">
          <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
