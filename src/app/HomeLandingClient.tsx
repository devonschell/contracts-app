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

  const goPrimary = () => {
    if (!loggedIn) return router.push("/signup");
    if (subscribed) return router.push("/dashboard");
    return router.push("/billing");
  };

  const startCheckout = async (priceId: string) => {
    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "checkout", priceId }),
    });

    const data = await res.json();
    if (data?.url) window.location.href = data.url;
  };

  return (
    <main className="bg-white text-slate-900">

      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/brand/oviu-logo.png" alt="OVIU" width={110} height={30} />
          </Link>

          <nav className="hidden md:flex gap-8 text-sm font-medium">
            <Link href="#features">Features</Link>
            <Link href="#workflow">Workflow</Link>
            <Link href="#pricing">Pricing</Link>
          </nav>

          <button
            onClick={goPrimary}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent)]"
          >
            {loggedIn ? "Open App" : "Get Started"}
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="pt-28 pb-32 px-6 text-center bg-gradient-to-b from-white to-slate-50">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
          AI-Powered Contract Intelligence
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
          Upload contracts, instantly extract critical terms, and track renewals
          before they auto-renew or expire.
        </p>

        <button
          onClick={goPrimary}
          className="inline-flex rounded-lg bg-[var(--primary)] px-8 py-4 text-lg font-medium text-white shadow-lg hover:bg-[var(--accent)]"
        >
          Start Using OVIU
        </button>

        <div className="mt-20 max-w-6xl mx-auto">
          <Image
            src="/images/landing/dashboard.png"
            alt="OVIU dashboard"
            width={1400}
            height={800}
            priority
            className="rounded-2xl border border-slate-200 shadow-2xl"
          />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-16">
            Built for teams that manage real contracts
          </h2>

          <div className="grid md:grid-cols-3 gap-14">
            <Feature
              title="AI Contract Summaries"
              desc="Pricing, renewal terms, obligations, risks, and unusual clauses extracted instantly."
            />
            <Feature
              title="Renewal Intelligence"
              desc="Color-coded timelines and alerts ensure nothing auto-renews unexpectedly."
            />
            <Feature
              title="Centralized Repository"
              desc="Securely upload, store, and track every agreement in one system."
            />
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="py-32 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">How OVIU works</h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              From upload to insight — everything happens automatically.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16">
            <Preview
              src="/images/landing/upload.png"
              title="Upload contracts"
              desc="Drag & drop PDFs or DOCX files in seconds."
            />
            <Preview
              src="/images/landing/ai.png"
              title="AI analyzes terms"
              desc="Key clauses, pricing, and renewal risks extracted instantly."
            />
            <Preview
              src="/images/landing/contracts.png"
              title="Track everything"
              desc="See contract status, renewals, and risk in one view."
            />
            <Preview
              src="/images/landing/dashboard.png"
              title="Stay ahead of renewals"
              desc="Portfolio-level visibility across all agreements."
            />
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-16">Simple, transparent pricing</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Plan
              name="Starter"
              price="$29"
              note="Up to 20 contracts"
              features={["AI summaries", "Renewal tracking"]}
              onClick={() =>
                startCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER!)
              }
            />
            <Plan
              featured
              name="Growth"
              price="$79"
              note="Up to 50 contracts"
              features={["Advanced alerts", "Priority support"]}
              onClick={() =>
                startCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH!)
              }
            />
            <Plan
              name="Pro"
              price="$149"
              note="Unlimited contracts"
              features={["Full AI analysis", "All features unlocked"]}
              onClick={() =>
                startCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!)
              }
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 py-12 px-6 text-sm text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-6">
          <span>© {new Date().getFullYear()} OVIU</span>
          <div className="flex gap-6">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </footer>
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
    <div className="text-center">
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-white mb-6">
        <Image src={src} alt={title} width={800} height={500} className="w-full" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-slate-600 mt-1">{desc}</p>
    </div>
  );
}

function Plan({
  name,
  price,
  note,
  features,
  featured,
  onClick,
}: {
  name: string;
  price: string;
  note: string;
  features: string[];
  featured?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border p-8 text-left ${
        featured
          ? "border-[var(--primary)] shadow-xl"
          : "border-slate-200"
      }`}
    >
      <h3 className="text-lg font-semibold mb-2">{name}</h3>
      <div className="text-4xl font-bold mb-1">{price}<span className="text-base font-medium">/mo</span></div>
      <p className="text-slate-500 mb-6">{note}</p>

      <ul className="space-y-2 mb-8 text-sm">
        {features.map((f) => (
          <li key={f}>✓ {f}</li>
        ))}
      </ul>

      <button
        onClick={onClick}
        className={`w-full rounded-lg py-3 font-medium ${
          featured
            ? "bg-[var(--primary)] text-white hover:bg-[var(--accent)]"
            : "border border-slate-300 hover:border-slate-400"
        }`}
      >
        Get {name}
      </button>
    </div>
  );
}
