"use client";

import { useState } from "react";

const plans = [
  { name: "Starter", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER!, price: "$39/mo" },
  { name: "Growth", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH!, price: "$99/mo" },
  { name: "Pro", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!, price: "$249/mo" },
];

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const email = "test@demo.com"; // later replace with Clerk user email

  async function handleAction(action: string, priceId?: string) {
    setLoading(true);
    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, priceId, customerEmail: email }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.url) window.location.href = data.url;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Billing</h1>
      <p className="text-gray-500 text-sm">Manage your plan and invoices below.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div
            key={p.name}
            className="rounded-xl border shadow-sm p-5 bg-white flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-semibold">{p.name}</h2>
              <p className="text-gray-500">{p.price}</p>
            </div>
            <button
              disabled={loading}
              onClick={() => handleAction("checkout", p.priceId)}
              className="mt-4 rounded-lg bg-[var(--primary)] text-white py-2 text-sm font-medium hover:opacity-90 transition"
            >
              {loading ? "Loading…" : "Choose Plan"}
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => handleAction("portal")}
        disabled={loading}
        className="rounded-lg border px-4 py-2 text-sm"
      >
        Manage Billing
      </button>
    </div>
  );
}
