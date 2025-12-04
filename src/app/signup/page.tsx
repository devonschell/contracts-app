// src/app/signup/page.tsx
"use client";

import { SignUp, SignedIn, SignedOut } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  return (
    <div className="h-screen grid place-items-center bg-background text-foreground">
      {/* LOGGED OUT → show Clerk SignUp */}
      <SignedOut>
        <SignUp 
          routing="path" 
          path="/signup"
          forceRedirectUrl="/signup"
          signInForceRedirectUrl="/login"
        />
      </SignedOut>

      {/* LOGGED IN → redirect to billing (new users need to pay) */}
      <SignedIn>
        <RedirectAfterSignup />
      </SignedIn>
    </div>
  );
}

function RedirectAfterSignup() {
  const router = useRouter();
  const [status, setStatus] = useState("Setting up your account…");

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/user-status", { method: "GET" });

        if (res.ok) {
          const data = await res.json();
          const isSubscribed = data.isSubscribed === true;

          if (!isSubscribed) {
            // New user → billing to pay
            setStatus("Redirecting to billing…");
            router.replace("/billing");
          } else {
            // Already subscribed (edge case) → check onboarding
            const onboardingStep = data.onboardingStep ?? 0;
            if (onboardingStep < 3) {
              setStatus("Redirecting to setup…");
              router.replace("/welcome");
            } else {
              setStatus("Redirecting to dashboard…");
              router.replace("/dashboard");
            }
          }
        } else {
          // Default to billing
          setStatus("Redirecting to billing…");
          router.replace("/billing");
        }
      } catch {
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
