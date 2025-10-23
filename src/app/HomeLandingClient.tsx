"use client";

import Link from "next/link";

export default function HomeLandingClient() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* ----- Header ----- */}
      <header className="w-full border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            ClauseIQ
          </h1>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#features" className="hover:text-blue-600 transition">
              Features
            </Link>
            <Link href="#pricing" className="hover:text-blue-600 transition">
              Pricing
            </Link>
            <Link href="#contact" className="hover:text-blue-600 transition">
              Contact
            </Link>
          </nav>
          <Link
            href="/login"
            className="rounded-md bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-600 transition"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* ----- Hero Section ----- */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 bg-gradient-to-b from-white to-slate-50">
        <h2 className="text-5xl font-bold leading-tight mb-6 text-slate-900">
          AI-Powered Contract Intelligence
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mb-10">
          ClauseIQ helps your business organize, summarize, and track every
          contract in one place — with automatic renewal alerts and weekly
          updates so nothing slips through the cracks.
        </p>
        <Link
          href="/signup"
          className="bg-blue-600 hover:bg-indigo-600 text-white font-medium rounded-md px-6 py-3 text-lg transition"
        >
          Get Started Free
        </Link>
        <div className="mt-14 w-full max-w-4xl">
          <img
            src="/dashboard-preview.png"
            alt="ClauseIQ Dashboard Preview"
            className="w-full rounded-xl shadow-lg border border-slate-200"
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
            <div>
              <h4 className="text-xl font-semibold mb-2 text-slate-900">
                Upload
              </h4>
              <p className="text-slate-600">
                Drag & drop or forward contracts. ClauseIQ automatically reads,
                extracts, and stores key details.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-2 text-slate-900">
                Summarize
              </h4>
              <p className="text-slate-600">
                Instantly see the who, when, and what — from payment terms to
                renewal dates — summarized by AI.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-2 text-slate-900">
                Track
              </h4>
              <p className="text-slate-600">
                View all upcoming renewals on your dashboard and get notified 30,
                15, 7, and 1 day before they’re due.
              </p>
            </div>
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
            <div className="border border-slate-200 rounded-xl p-8 bg-white shadow-sm">
              <h4 className="text-xl font-semibold mb-2">Starter</h4>
              <p className="text-slate-500 mb-6">Up to 50 contracts</p>
              <div className="text-4xl font-bold mb-6">$39/mo</div>
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-indigo-600 text-white font-medium rounded-md px-4 py-2 text-sm transition"
              >
                Start Free
              </Link>
            </div>
            <div className="border border-slate-200 rounded-xl p-8 bg-white shadow-sm">
              <h4 className="text-xl font-semibold mb-2">Growth</h4>
              <p className="text-slate-500 mb-6">Up to 250 contracts</p>
              <div className="text-4xl font-bold mb-6">$99/mo</div>
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-indigo-600 text-white font-medium rounded-md px-4 py-2 text-sm transition"
              >
                Start Free
              </Link>
            </div>
            <div className="border border-slate-200 rounded-xl p-8 bg-white shadow-sm">
              <h4 className="text-xl font-semibold mb-2">Pro</h4>
              <p className="text-slate-500 mb-6">Up to 1,000 contracts</p>
              <div className="text-4xl font-bold mb-6">$249/mo</div>
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-indigo-600 text-white font-medium rounded-md px-4 py-2 text-sm transition"
              >
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ----- Footer ----- */}
      <footer className="py-10 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} ClauseIQ — AI-powered contract intelligence
        </div>
      </footer>
    </main>
  );
}
