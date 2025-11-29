// src/app/login/[[...rest]]/page.tsx
"use client";

import { SignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  return (
    <div className="h-screen grid place-items-center bg-background text-foreground">
      {/* LOGGED OUT → show Clerk SignIn */}
      <SignedOut>
        <SignIn routing="path" path="/login" />
      </SignedOut>

      {/* LOGGED IN → immediately redirect based on subscription */}
      <SignedIn>
        <RedirectWhenSignedIn />
      </SignedIn>
    </div>
  );
}

function RedirectWhenSignedIn() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/billing", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          if (data?.subscribed) {
            router.replace("/dashboard");
          } else {
            router.replace("/billing");
          }
        } else {
          // fallback: just go to dashboard
          router.replace("/dashboard");
        }
      } catch {
        router.replace("/dashboard");
      }
    };

    run();
  }, [router]);

  return (
    <div className="h-screen grid place-items-center">
      <p>Redirecting…</p>
    </div>
  );
}
