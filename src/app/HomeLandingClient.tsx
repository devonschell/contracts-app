// src/app/HomeLandingClient.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Props = {
  loggedIn: boolean;
  subscribed: boolean;
};

export default function HomeLandingClient({ loggedIn, subscribed }: Props) {
  const router = useRouter();

  // ---- Sign In button behavior ----
  const handleSignIn = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    if (!loggedIn) {
      router.push("/login");
      return;
    }

    // logged in:
    if (subscribed) {
      router.push("/dashboard");
    } else {
      router.push("/billing");
    }
  };

  // ---- "Get Started" button behavior ----
  const handleGetStarted = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    if (!loggedIn) {
      router.push("/signup");
      return;
    }

    // logged in:
    if (subscribed) {
      router.push("/dashboard");
    } else {
      router.push("/billing");
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">

      {/* ----- Header ----- */}
      <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-2 md:py-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline">
            <Image
              src="/brand/oviu-logo.png"
              alt="OVIU"
              width={110}
              height={30}
              priority
              className="object-contain"
            />
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#features" className="hover:text-[var(--primary)] transition">Features</Link>
            <Link href="#pricing" className="hover:text-[var(--primary)] transition">Pricing</Link>
            <Link href="#contact" className="hover:text-[var(--primary)] transition">Contact</Link>
          </nav>

          {/* Sign In – always SAY "Sign In" */}
          <Link
            href="/login"
            onClick={handleSignIn}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-white text-sm font-medium hover:bg-[var(--accent)] transition"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* ----- Hero Section ----- */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-20 md:py-28 bg-gradient-to-b from-white to-slate-50">
        <h2 className="text-5xl font-bold leading-tight mb-6 text-slate-900">
          AI-Powered Contract Intelligence
        </h2>

        <p className="text-lg text-slate-600 max-w-2xl mb-10">
          OVIU helps your business organize, summarize, and track every contract in one place.
        </p>

        {/* Hero CTA – always SAY "Get Started" */}
        <Link
          href="/signup"
          onClick={handleGetStarted}
          className="bg-[var(--primary)] hover:bg-[var(--accent)] text-white font-medium rounded-md px-6 py-3 text-lg transition"
        >
          Get Started
        </Link>

        <div className="mt-16 w-full max-w-5xl">
          <Image
            src="/dashboard-preview.png"
            alt="OVIU Dashboard Preview"
            width={1200}
            height={700}
            className="w-full rounded-xl shadow-2xl border border-slate-200"
            priority
          />
        </div>
      </section>

      {/* rest unchanged... */}
    </main>
  );
}
