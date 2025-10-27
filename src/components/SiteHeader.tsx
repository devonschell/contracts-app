// src/components/SiteHeader.tsx
"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";

export default function SiteHeader() {
  return (
    <header className="w-full border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
        <Link href="/" className="text-sm font-semibold">ClauseIQ</Link>
        <div className="flex items-center gap-3">
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn-outline">Sign in</button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
