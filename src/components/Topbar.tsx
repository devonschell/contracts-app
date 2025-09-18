"use client";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Topbar() {
  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-4">
      <div className="text-sm text-gray-600">Contract Intelligence</div>
      <div className="text-sm">
        <SignedIn>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <Link href="/login" className="underline">Log in</Link>
        </SignedOut>
      </div>
    </header>
  );
}
