// src/components/Topbar.tsx
"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/contracts" className="text-sm font-medium tracking-tight text-slate-800">
            Contract Intelligence
          </Link>
          {/* Optional: slot for breadcrumbs on detail pages */}
          {/* <span className="text-slate-400">/</span>
          <span className="text-sm text-slate-500">Contracts</span> */}
        </div>
        <div className="text-sm">
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <Link href="/login" className="underline">Log in</Link>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
