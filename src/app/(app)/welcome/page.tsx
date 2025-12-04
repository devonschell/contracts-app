// src/app/(app)/welcome/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";

type Prefs = {
  recipientsCsv: string;
  renewalAlerts: boolean;
  weeklyDigest: boolean;
  noticeDays: number;
};

type PlanKey = "starter" | "growth" | "pro";

const PLAN_EMAIL_LIMITS: Record<PlanKey, number> = {
  starter: 1,
  growth: 5,
  pro: 15,
};

export default function WelcomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  // Clerk login email → default billingEmail
  const loginEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "";

  const planParam = (searchParams.get("plan") || "").toLowerCase() as PlanKey;
  const plan: PlanKey = ["starter", "growth", "pro"].includes(planParam)
    ? planParam
    : "growth";

  const maxEmails = PLAN_EMAIL_LIMITS[plan];

  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [billingEmail, setBillingEmail] = useState(loginEmail);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing notification prefs
  useEffect(() => {
    let cancelled = false;

    fetch("/api/settings/notifications")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;

        const data: Prefs =
          j?.data ?? {
            recipientsCsv: "",
            renewalAlerts: true,
            weeklyDigest: true,
            noticeDays: 30,
          };

        setPrefs(data);

        const existingEmails = data.recipientsCsv
          ? data.recipientsCsv.split(",").map((e) => e.trim()).filter(Boolean)
          : [];

        setEmails(existingEmails);
      })
      .catch(() => {
        if (cancelled) return;
        setPrefs({
          recipientsCsv: "",
          renewalAlerts: true,
          weeklyDigest: true,
          noticeDays: 30,
        });
        setEmails([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!prefs) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading your settings…</p>
      </div>
    );
  }

  /* ---------------------- Add/remove emails ----------------------- */

  function handleAddEmail(e?: FormEvent) {
    if (e) e.preventDefault();
    setError(null);

    const raw = emailInput.trim();
    if (!raw) return;

    if (emails.length >= maxEmails) {
      setError(`Your ${plan} plan allows up to ${maxEmails} email(s).`);
      return;
    }

    if (!raw.includes("@") || raw.startsWith("@") || raw.endsWith("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (emails.includes(raw)) {
      setError("This email is already added.");
      return;
    }

    setEmails((prev) => [...prev, raw]);
    setEmailInput("");
  }

  function handleRemoveEmail(target: string) {
    setError(null);
    setEmails((prev) => prev.filter((e) => e !== target));
  }

  /* ---------------------- Save & Continue ------------------------- */

  async function handleContinue() {
    setSaving(true);
    setError(null);

    try {
      const recipientsCsv = emails.join(", ");

      // 1️⃣ Save billingEmail + profile fields
      const profRes = await fetch("/api/settings/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingEmail,
        }),
      });

      if (!profRes.ok) {
        const t = await profRes.text();
        throw new Error(`Profile error: ${t}`);
      }

      // 2️⃣ Save notifications
      const updatedPrefs = {
        ...prefs,
        recipientsCsv,
      };

      const notifRes = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPrefs),
      });

      if (!notifRes.ok) {
        const t = await notifRes.text();
        throw new Error(`Notifications error: ${t}`);
      }

      // 3️⃣ Mark onboarding step 2 (ready for upload)
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 2 }),
      });

      // 4️⃣ Redirect → Upload page
      router.push("/upload");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--primary)]">
          Welcome to OVIU
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Let&apos;s set up your alerts
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Add who should receive renewal reminders and weekly summaries.
        </p>
      </header>

      {/* MAIN CARD */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
        {/* BILLING EMAIL */}
        <div className="space-y-2">
          <p className="font-medium text-sm">Billing email</p>
          <input
            type="email"
            value={billingEmail}
            onChange={(e) => setBillingEmail(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm"
          />
          <p className="text-xs text-muted-foreground">
            We'll send receipts and account notices here.
          </p>
        </div>

        {/* NOTIFICATION RECIPIENTS */}
        <div className="space-y-2">
          <p className="font-medium text-sm">
            Renewal reminder recipients{" "}
            <span className="ml-1 text-xs text-muted-foreground">
              ({plan} plan · up to {maxEmails})
            </span>
          </p>

          <form onSubmit={handleAddEmail} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {emails.map((e) => (
                <span
                  key={e}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
                >
                  {e}
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(e)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </span>
              ))}
              {emails.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  No recipients yet.
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="teammate@company.com"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[var(--accent)]"
              >
                Add email
              </button>
            </div>
          </form>
        </div>

        {/* TOGGLES WITH TOOLTIPS */}
        <div className="grid gap-4 sm:grid-cols-2 pt-3">
          <label className="flex items-start gap-3 group relative">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={prefs.renewalAlerts}
              onChange={(e) =>
                setPrefs((prev) => prev && { ...prev, renewalAlerts: e.target.checked })
              }
            />
            <div>
              <p className="text-sm font-medium flex items-center gap-1">
                Renewal alerts
                <span className="relative inline-block">
                  <span className="cursor-help text-muted-foreground hover:text-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </span>
                  <span className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-foreground text-background text-xs rounded shadow-lg z-10">
                    Get notified 90, 60, and 30 days before a contract renews so you never miss a cancellation window.
                  </span>
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                We'll email your recipients before each renewal date.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 group relative">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={prefs.weeklyDigest}
              onChange={(e) =>
                setPrefs((prev) => prev && { ...prev, weeklyDigest: e.target.checked })
              }
            />
            <div>
              <p className="text-sm font-medium flex items-center gap-1">
                Weekly digest
                <span className="relative inline-block">
                  <span className="cursor-help text-muted-foreground hover:text-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </span>
                  <span className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-foreground text-background text-xs rounded shadow-lg z-10">
                    Every Monday, receive a summary of all your contracts, upcoming renewals, and recent activity.
                  </span>
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Weekly summary of contracts and renewals.
              </p>
            </div>
          </label>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
      </section>

      {/* FOOTER */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          You can change these anytime in Settings.
        </p>
        <button
          onClick={handleContinue}
          disabled={saving}
          className="rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[var(--accent)] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save & continue to uploads"}
        </button>
      </div>
    </div>
  );
}
