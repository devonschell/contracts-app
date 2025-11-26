"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) router.replace("/dashboard");
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="h-screen grid place-items-center">
        <p>Loading…</p>
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="h-screen grid place-items-center">
        <p>Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="h-screen grid place-items-center">
      <SignIn routing="path" />
    </div>
  );
}
