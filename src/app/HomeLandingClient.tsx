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

  const goToApp = () => {
    if (!loggedIn) return router.push("/signup");
    if (subscribed) return router.push("/dashboard");
    return router.push("/billing");
  };

  const purchase = async (priceId: string) => {
    if (!loggedIn) return router.push("/signup");

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });

    const { url } = await res.json();
    router.push(url);
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* NAV */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/brand/oviu-logo.png" alt="OVIU" width={110} height={30} />
          </Link>

          <nav className="hidden md:flex gap-8 text-sm font-medium">
            <Link href="#features">Features</Link>
            <Link href="#product">Product</Link>
            <Link href="#pricing">Pricing</Link>
          </nav>

          <button
            onClick={goToApp}
            className="rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--accent)] transition"
          >
            {loggedIn ? "Open App" : "Get Started"}
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-28 text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            AI-Powered Contract Intelligence
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
            Centralize contracts, extract key terms, and track renewals automatically —
            before they turn into expensive mistakes.
          </p>

          <button
            onClick={goToApp}
            className="rounded-xl bg-[var(--primary)] px-8 py-4 text-lg font-medium text-white shadow-lg hover:bg-[var(--accent)] transition"
          >
            Get Started
          </button>

          <div className="mt-20">
            <Image
              src="/images/landing/dashboard.png"
              alt="OVIU dashboard"
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
            <Feature title="AI Contract Summaries" desc="Instantly extract pricing, renewals, obligations, and risk." />
            <Feature title="Renewal Intelligence" desc="Color-coded alerts prevent unwanted auto-renewals." />
            <Feature title="Centralized Repository" desc="Upload and track every agreement in one secure place." />
          </div>
        </div>
      </section>

      {/* PRODUCT */}
      <section id="product" className="py-32 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16">
          <Preview src="/images/landing/contracts.png" title="Contracts Overview" />
          <Preview src="/images/landing/ai.png" title="AI Summaries" />
          <Preview src="/images/landing/upload.png" title="Simple Uploads" />
          <Preview src="/images/landing/dashboard.png" title="Renewal Dashboard" />
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-32 px-6 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-14">Simple, transparent pricing</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Plan
              title="Starter"
              price="$29"
              features={["Up to 20 contracts", "AI summaries", "Renewal tracking"]}
              onClick={() => purchase(process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER!)}
            />

            <Plan
              title="Growth"
              price="$79"
              highlight
              features={["Up to 50 contracts", "Advanced alerts", "Priority support"]}
              onClick={() => purchase(process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH!)}
            />

            <Plan
              title="Pro"
              price="$149"
              features={["Unlimited contracts", "Full AI analysis", "All features"]}
              onClick={() => purchase(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!)}
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
      <p className="text-slate-600 text-sm">{desc}</p>
    </div>
  );
}

function Preview({ src, title }: { src: string; title: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-white">
      <Image src={src} alt={title} width={800} height={500} className="w-full object-cover" />
    </div>
  );
}

function Plan({
  title,
  price,
  features,
  onClick,
  highlight,
}: {
  title: string;
  price: string;
  features: string[];
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-8 border ${highlight ? "border-[var(--primary)] shadow-xl" : "border-slate-200"}`}>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <div className="text-4xl font-bold mb-6">{price}<span className="text-base text-slate-500">/mo</span></div>

      <ul className="space-y-3 text-sm text-slate-700 mb-8">
        {features.map(f => <li key={f}>✓ {f}</li>)}
      </ul>

      <button
        onClick={onClick}
        className={`w-full rounded-lg px-4 py-3 font-medium transition ${
          highlight
            ? "bg-[var(--primary)] text-white hover:bg-[var(--accent)]"
            : "border border-slate-300 hover:border-slate-400"
        }`}
      >
        Get {title}
      </button>
    </div>
  );
}
