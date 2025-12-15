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

  const navigate = (target: string) => {
    if (!loggedIn) return router.push("/signup");
    if (subscribed) return router.push("/dashboard");
    return router.push("/billing");
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">

      {/* NAVBAR */}
      <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <Image
              src="/brand/oviu-logo.png"
              alt="OVIU"
              width={110}
              height={30}
              className="object-contain"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#features" className="hover:text-[var(--primary)] transition">Features</Link>
            <Link href="#product" className="hover:text-[var(--primary)] transition">Product</Link>
            <Link href="#pricing" className="hover:text-[var(--primary)] transition">Pricing</Link>
          </nav>

          <button
            onClick={() => navigate("signin")}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-white text-sm font-medium hover:bg-[var(--accent)] transition"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-20 md:py-28 bg-gradient-to-b from-white to-slate-50">
        <h1 className="text-5xl font-bold leading-tight mb-6">
          AI-Powered Contract Intelligence
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl mb-10">
          Centralize every agreement. Automatically summarize terms. Track renewals before they become a problem.
        </p>

        <button
          onClick={() => navigate("cta")}
          className="bg-[var(--primary)] hover:bg-[var(--accent)] text-white font-medium rounded-md px-6 py-3 text-lg transition"
        >
          Get Started
        </button>

        {/* HERO IMAGE */}
        <div className="mt-16 w-full max-w-5xl">
          <Image
            src="/images/landing/oviu-full-dashboard.png"
            alt="OVIU Dashboard Overview"
            width={1200}
            height={700}
            className="w-full rounded-xl shadow-2xl border border-slate-200"
            priority
          />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-10">Why teams use OVIU</h2>

          <div className="grid md:grid-cols-3 gap-12 mt-12">
            <Feature
              title="AI Contract Summaries"
              desc="Instantly extract pricing, terms, renewals, obligations, and unusual clauses."
            />
            <Feature
              title="Auto-Tracking Renewals"
              desc="Never miss a renewal again with automated alerts and color-coded risk timelines."
            />
            <Feature
              title="Centralized Repository"
              desc="Upload PDFs or DOCX files and store everything securely in one place."
            />
          </div>
        </div>
      </section>

      {/* PRODUCT PREVIEW */}
      <section id="product" className="py-24 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8">See OVIU in action</h2>
          <p className="text-slate-600 mb-14">
            A clean, modern interface designed to help you move fast.
          </p>

          {/* 3 IMAGE STRIP */}
          <div className="grid md:grid-cols-3 gap-6">
            <PreviewImage src="/images/landing/oviu-contracts-page.png" alt="Contracts page" />
            <PreviewImage src="/images/landing/oviu-upload.png" alt="Upload page" />
            <PreviewImage src="/images/landing/oviu-ai-summary.png" alt="AI summary" />
          </div>
        </div>
      </section>

    </main>
  );
}

/* COMPONENTS */
function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="text-left md:text-center">
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-slate-600 text-sm">{desc}</p>
    </div>
  );
}

function PreviewImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-slate-200 shadow-lg bg-white">
      <Image
        src={src}
        alt={alt}
        width={600}
        height={400}
        className="w-full object-cover"
      />
    </div>
  );
}
