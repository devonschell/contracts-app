"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration issues
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // FIX: Only redirect if coming directly to /login WHILE signed in.
  useEffect(() => {
    if (!isSignedIn) return;

    // DO NOT use the redirect_url param — that causes a loop.
    router.replace("/dashboard");
  }, [isSignedIn, router]);

  if (isSignedIn) {
    return (
      <div className="min-h-[60vh] grid place-items-center p-6">
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <SignIn
        routing="path"
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}
