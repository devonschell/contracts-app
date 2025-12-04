// src/app/login/[[...rest]]/page.tsx
"use client";

import { SignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  return (
    <div className="h-screen grid place-items-center bg-background text-foreground">
      {/* LOGGED OUT → show Clerk SignIn */}
      <SignedOut>
        <SignIn 
          routing="path" 
          path="/login"
          forceRedirectUrl="/login"
          signUpForceRedirectUrl="/login"
        />
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
  const [status, setStatus] = useState("Checking your account…");

  useEffect(() => {
    const run = async () => {
      try {
        // Check subscription and onboarding status
        const res = await fetch("/api/user-status", { method: "GET" });

        if (res.ok) {
          const data = await res.json();
          const isSubscribed = data.isSubscribed === true;
          const onboardingStep = data.onboardingStep ?? 0;

          if (!isSubscribed) {
            // Not paid → billing
            setStatus("Redirecting to billing…");
            router.replace("/billing");
          } else if (onboardingStep < 3) {
            // Paid but onboarding incomplete
            if (onboardingStep <= 1) {
              setStatus("Redirecting to setup…");
              router.replace("/welcome");
            } else {
              setStatus("Redirecting to upload…");
              router.replace("/upload");
            }
          } else {
            // Paid + onboarding complete → dashboard
            setStatus("Redirecting to dashboard…");
            router.replace("/dashboard");
          }
        } else {
          // API error → default to billing (safe fallback)
          setStatus("Redirecting to billing…");
          router.replace("/billing");
        }
      } catch {
        // Network error → default to billing
        setStatus("Redirecting to billing…");
        router.replace("/billing");
      }
    };

    run();
  }, [router]);

  return (
    <div className="h-screen grid place-items-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <p className="text-sm text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
