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

  const navigate = () => {
    if (!loggedIn) return router.push("/signup");
    if (subscribed) return router.push("/dashboard");
    return router.push("/billing");
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* NAVBAR */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/brand/oviu-logo.png"
              alt="OVIU"
              width={110}
              height={30}
            />
          </Link>

          <nav className="hidden md:flex gap-8 text-sm font-medium">
            <Link href="#features" className="hover:text-[var(--primary)]">Features</Link>
            <Link href="#product" className="hover:text-[var(--primary)]">Product</Link>
            <Link href="#pricing" className="hover:text-[var(--primary)]">Pricing</Link>
          </nav>

          <button
            onClick={navigate}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent)] transition"
          >
            {loggedIn ? "Open App" : "Sign In"}
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-28 text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            AI-Powered Contract Intelligence
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
            Centralize contracts, extract critical terms, and track renewals automatically —
            before they turn into expensive mistakes.
          </p>

          <button
            onClick={navigate}
            className="inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-8 py-4 text-lg font-medium text-white shadow-lg hover:bg-[var(--accent)] transition"
          >
            Get Started
          </button>

          {/* HERO IMAGE */}
          <div className="mt-20">
            <Image
              src="/images/landing/dashboard.png"
              alt="OVIU Dashboard"
              width={1400}
              height={800}
              priority
              className="mx-auto rounded-2xl border border-slate-200 shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-14">
            Built for teams that manage real contracts
          </h2>

          <div className="grid md:grid-cols-3 gap-14">
            <Feature
              title="AI Contract Summaries"
              desc="Instantly extract pricing, renewal terms, obligations, risks, and unusual clauses."
            />
            <Feature
              title="Renewal Intelligence"
              desc="Color-coded timelines and alerts ensure nothing auto-renews unexpectedly."
            />
            <Feature
              title="Centralized System of Record"
              desc="Securely upload, store, and track every agreement in one place."
            />
          </div>
        </div>
      </section>

      {/* PRODUCT */}
      <section id="product" className="py-32 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-6">See OVIU in action</h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              A clean, modern interface designed to surface risk instantly and keep teams ahead.
            </p>
          </div>

          {/* IMAGE GRID */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            <Preview
              src="/images/landing/contracts.png"
              title="Contract Repository"
              desc="View every contract, renewal date, and risk status at a glance."
            />

            <Preview
              src="/images/landing/ai.png"
              title="AI-Generated Summaries"
              desc="Key terms, pricing, obligations, and renewal traps — instantly extracted."
            />

            <Preview
              src="/images/landing/upload.png"
              title="Simple Uploads"
              desc="Drag and drop PDFs or DOCX files. We handle the rest."
            />

            <Preview
              src="/images/landing/dashboard.png"
              title="Renewal Dashboard"
              desc="Understand renewal exposure across your entire contract portfolio."
            />

          </div>
        </div>
      </section>

    </main>
  );
}

/* ---------- COMPONENTS ---------- */

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function Preview({
  src,
  title,
  desc,
}: {
  src: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="group">
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-white transition-transform group-hover:-translate-y-1">
        <Image
          src={src}
          alt={title}
          width={800}
          height={500}
          className="w-full object-cover"
        />
      </div>
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-slate-600 mt-1">{desc}</p>
    </div>
  );
}
