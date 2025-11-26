// src/app/login/[[...rest]]/page.tsx
"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  // 1️⃣ Wait for Clerk to load before making any decisions
  useEffect(() => {
    if (!isLoaded) return;

    // 2️⃣ If user is signed in, redirect OUTSIDE the render phase
    if (isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  // 3️⃣ Clerk still loading
  if (!isLoaded) {
    return (
      <div className="h-screen grid place-items-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  // 4️⃣ Signed-in users will be redirected by the effect above
  if (isSignedIn) {
    return (
      <div className="h-screen grid place-items-center">
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  // 5️⃣ Signed-out users get Clerk UI
  return (
    <div className="h-screen grid place-items-center">
      <SignIn
        routing="path"
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/welcome"
      />
    </div>
  );
}
