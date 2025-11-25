// src/app/signup/page.tsx
"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <SignUp
        routing="hash"
        afterSignInUrl="/dashboard"
        afterSignUpUrl="/dashboard"
      />
    </div>
  );
}
