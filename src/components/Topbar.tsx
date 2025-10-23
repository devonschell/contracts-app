// src/components/Topbar.tsx
"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6">
        {/* Left: Wordmark */}
        <Link href="/" className="select-none">
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            ClauseIQ
          </span>
        </Link>

        {/* Right: Clerk user */}
        <div className="text-sm">
          <SignedIn>
            <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
          </SignedIn>
          <SignedOut>
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
