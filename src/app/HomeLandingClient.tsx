// src/app/HomeLandingClient.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Props = {
  loggedIn: boolean;
};

export default function HomeLandingClient({ loggedIn }: Props) {
  const router = useRouter();

  const handleSignInClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (loggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  const handlePrimaryCtaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (loggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/signup");
    }
  };

  const headerButtonLabel = loggedIn ? "Go to dashboard" : "Sign In";
  const heroButtonLabel = loggedIn ? "Go to dashboard" : "Get Started Free";

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
            <Link href="#features" className="hover:text-[var(--primary)] transition">
              Features
            </Link>
            <Link href="#pricing" className="hover:text-[var(--primary)] transition">
              Pricing
            </Link>
            <Link href="#contact" className="hover:text-[var(--primary)] transition">
              Contact
            </Link>
          </nav>

          {/* Sign In / Go to dashboard */}
          <Link
            href={loggedIn ? "/dashboard" : "/login"}
            onClick={handleSignInClick}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-white text-sm font-medium hover:bg-[var(--accent)] transition"
          >
            {headerButtonLabel}
          </Link>
        </div>
      </header>

      {/* ----- Hero Section ----- */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-20 md:py-28 bg-gradient-to-b from-white to-slate-50">
        <h2 className="text-5xl font-bold leading-tight mb-6 text-slate-900">
          AI-Powered Contract Intelligence
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mb-10">
          OVIU helps your business organize, summarize, and track every contract
          in one place — with automatic renewal alerts and weekly updates so
          nothing slips through the cracks.
        </p>
        <Link
          href={loggedIn ? "/dashboard" : "/signup"}
          onClick={handlePrimaryCtaClick}
          className="bg-[var(--primary)] hover:bg-[var(--accent)] text-white font-medium rounded-md px-6 py-3 text-lg transition"
        >
          {heroButtonLabel}
        </Link>

        {/* Screenshot */}
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

      {/* ----- Features Section ----- */}
      <section id="features" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-semibold mb-12">
            Turn every contract into actionable insight
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
            {[
              {
                title: "Upload",
                desc: "Drag & drop or forward contracts. OVIU automatically reads, extracts, and stores key details.",
                img: "/upload-preview.png",
              },
              {
                title: "Summarize",
                desc: "Instantly see the who, when, and what — from payment terms to renewal dates — summarized by AI.",
                img: "/summary-preview.png",
              },
              {
                title: "Track",
                desc: "View all upcoming renewals on your dashboard and get notified well before they’re due.",
                img: "/contracts-preview.png",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="space-y-4 hover:scale-[1.02] transition-transform duration-300"
              >
                <Image
                  src={f.img}
                  alt={`${f.title} preview`}
                  width={400}
                  height={250}
                  className="rounded-lg border border-slate-200 shadow-sm w-full"
                />
                <h4 className="text-xl font-semibold text-slate-900">{f.title}</h4>
                <p className="text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----- Pricing Section ----- */}
      <section
        id="pricing"
        className="py-24 bg-slate-50 border-t border-slate-200 text-center"
      >
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-3xl font-semibold mb-10">
            Simple, transparent pricing
          </h3>
          <p className="text-slate-600 mb-14">
            Pay only for what you need. Start free — upgrade when you’re ready.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { name: "Starter", contracts: 30, price: 39 },
              { name: "Growth", contracts: 200, price: 99 },
              { name: "Pro", contracts: 800, price: 249 },
            ].map((tier) => (
              <div
                key={tier.name}
                className="border border-slate-200 rounded-xl p-8 bg-white shadow-sm hover:shadow-md transition"
              >
                <h4 className="text-xl font-semibold mb-2">{tier.name}</h4>
                <p className="text-slate-500 mb-6">
                  Up to {tier.contracts.toLocaleString()} contracts
                </p>
                <div className="text-4xl font-bold mb-6">${tier.price}/mo</div>
                <Link
                  href={loggedIn ? "/dashboard" : "/signup"}
                  onClick={handlePrimaryCtaClick}
                  className="bg-[var(--primary)] hover:bg-[var(--accent)] text-white font-medium rounded-md px-4 py-2 text-sm transition"
                >
                  Start Free
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----- Footer ----- */}
      <footer className="py-10 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} OVIU — AI-powered contract intelligence
        </div>
      </footer>
    </main>
  );
}
