// src/app/login/page.tsx
"use client";
import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="h-screen grid place-items-center">
      <SignIn routing="path" />
    </div>
  );
}
