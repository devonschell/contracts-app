"use client";
import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <SignIn routing="hash" />
    </div>
  );
}
