"use client";

export const dynamic = "force-dynamic";

import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <main className="min-h-screen grid place-items-center bg-background px-6 py-12">
      <SignIn signUpUrl="/signup" />
    </main>
  );
}
