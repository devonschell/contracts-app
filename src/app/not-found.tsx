// src/app/not-found.tsx
export const dynamic = "force-static";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] grid place-items-center p-8 bg-white text-slate-800">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-sm text-slate-600">
          Sorry, we couldn’t find that page.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="btn-outline">Go Home</Link>
          <Link href="/login" className="btn-primary">Sign in</Link>
        </div>
      </div>
    </main>
  );
}
