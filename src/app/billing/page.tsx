"use client";

import { useState } from "react";

const STARTER_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER!;
const GROWTH_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH!;
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!;

type PlanKey = "starter" | "growth" | "pro";

const PLAN_TO_PRICE_ID: Record<PlanKey, string> = {
  starter: STARTER_PRICE_ID,
  growth: GROWTH_PRICE_ID,
  pro: PRO_PRICE_ID,
};

export default function BillingPage() {
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (plan: PlanKey) => {
    setLoadingPlan(plan);
    setError(null);

    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "checkout",
          priceId: PLAN_TO_PRICE_ID[plan],
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout");
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error("Billing checkout error:", err);
      setError(err.message || "Something went wrong starting checkout.");
      setLoadingPlan(null);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-4">
      <div className="max-w-4xl w-full">
        <header className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold mb-3">
            Choose your OVIU plan
          </h1>
          <p className="text-slate-300">
            Unlock AI-powered contract intelligence. You&apos;ll be charged
            securely via Stripe and can cancel anytime.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Starter */}
          <PlanCard
            name="Starter"
            desc="For solo operators and small teams just getting started."
            price="$29"
            period="/month"
            features={[
              "Up to 100 contracts",
              "AI summaries & key fields",
              "Email renewal reminders",
            ]}
            loading={loadingPlan === "starter"}
            onSelect={() => handleCheckout("starter")}
          />

          {/* Growth */}
          <PlanCard
            name="Growth"
            desc="For growing finance/legal teams who need more volume."
            price="$79"
            period="/month"
            highlight
            features={[
              "Up to 500 contracts",
              "All Starter features",
              "Weekly digest emails",
              "Advanced search & filters",
            ]}
            loading={loadingPlan === "growth"}
            onSelect={() => handleCheckout("growth")}
          />

          {/* Pro */}
          <PlanCard
            name="Pro"
            desc="For teams managing large contract portfolios."
            price="$149"
            period="/month"
            features={[
              "Up to 2,000 contracts",
              "All Growth features",
              "Priority support",
              "Custom onboarding",
            ]}
            loading={loadingPlan === "pro"}
            onSelect={() => handleCheckout("pro")}
          />
        </div>

        <p className="mt-6 text-xs text-slate-500 text-center">
          Already subscribed? Your access will unlock automatically after
          payment. You can manage your subscription at any time from the billing
          settings inside the app.
        </p>
      </div>
    </main>
  );
}

type PlanCardProps = {
  name: string;
  desc: string;
  price: string;
  period: string;
  features: string[];
  highlight?: boolean;
  loading?: boolean;
  onSelect: () => void;
};

function PlanCard({
  name,
  desc,
  price,
  period,
  features,
  highlight,
  loading,
  onSelect,
}: PlanCardProps) {
  return (
    <div
      className={`flex flex-col rounded-2xl border px-5 py-6 shadow-sm bg-slate-900/80 ${
        highlight
          ? "border-indigo-500 shadow-indigo-500/20"
          : "border-slate-800"
      }`}
    >
      <h2 className="text-lg font-semibold mb-1">{name}</h2>
      <p className="text-xs text-slate-400 mb-4">{desc}</p>

      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-3xl font-bold">{price}</span>
        <span className="text-xs text-slate-400">{period}</span>
      </div>

      <ul className="flex-1 space-y-1.5 mb-4 text-xs text-slate-300">
        {features.map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={loading}
        className={`mt-auto w-full rounded-xl px-3 py-2 text-sm font-medium ${
          highlight
            ? "bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/60"
            : "bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/60"
        }`}
      >
        {loading ? "Redirecting to Stripe..." : "Continue to Stripe"}
      </button>
    </div>
  );
}
