// src/components/NewContractButton.tsx
"use client";

import Link from "next/link";

export default function NewContractButton() {
  return (
    <Link
      href="/upload"
      className="rounded-md bg-black px-3 py-1.5 text-white text-sm"
      prefetch
    >
      New Contract
    </Link>
  );
}
