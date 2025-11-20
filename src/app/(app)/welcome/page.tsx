// src/app/(app)/welcome/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

  // Read plan from query (?plan=starter|growth|pro) – we'll wire this later from Stripe
  const planParam = (searchParams.get("plan") || "").toLowerCase() as PlanKey;
  const plan: PlanKey = ["starter", "growth", "pro"].includes(planParam)
    ? planParam
    : "growth"; // default

  const maxEmails = PLAN_EMAIL_LIMITS[plan];

  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing notification prefs (if any)
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
          ? data.recipientsCsv
              .split(",")
              .map((e: string) => e.trim())
              .filter(Boolean)
          : [];

        setEmails(existingEmails);
      })
      .catch(() => {
        if (cancelled) return;
        const fallback: Prefs = {
          recipientsCsv: "",
          renewalAlerts: true,
          weeklyDigest: true,
          noticeDays: 30,
        };
        setPrefs(fallback);
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

  function handleAddEmail(e?: FormEvent) {
    if (e) e.preventDefault();
    setError(null);

    const raw = emailInput.trim();
    if (!raw) return;

    if (emails.length >= maxEmails) {
      setError(
        `You can add up to ${maxEmails} email${maxEmails === 1 ? "" : "s"} on your ${plan} plan.`
      );
      return;
    }

    // Extremely light validation – just enough for now
    if (!raw.includes("@") || raw.startsWith("@") || raw.endsWith("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (emails.includes(raw)) {
      setError("That email is already added.");
      return;
    }

    setEmails((prev) => [...prev, raw]);
    setEmailInput("");
  }

  function handleRemoveEmail(target: string) {
    setError(null);
    setEmails((prev) => prev.filter((e) => e !== target));
  }

  async function handleContinue() {
    setSaving(true);
    setError(null);

    try {
      const recipientsCsv = emails.join(", ");

      const updated: Prefs = {
        ...prefs,
        recipientsCsv,
        // prefs.renewalAlerts and prefs.weeklyDigest already bound to toggles below
      };

      const res = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to save notification settings.");
      }

      // ✅ Onboarding step complete -> send them to upload page
      router.push("/upload");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
      {/* Header */}
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--primary)]">
          Welcome to OVIU
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Let&apos;s set up your alerts
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Tell us who should receive contract renewal reminders and weekly summaries.
          You can change these anytime in Settings.
        </p>

        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-semibold">
            1
          </span>
          <span>Step 1 of 2 — Notifications</span>
        </div>
      </header>

      {/* Main card */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
        {/* Plan + limit hint */}
        <div className="flex flex-col gap-1 text-sm">
          <p className="font-medium">
            Notification recipients{" "}
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground ml-1">
              {plan.charAt(0).toUpperCase() + plan.slice(1)} plan · up to {maxEmails}{" "}
              email{maxEmails === 1 ? "" : "s"}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Add the teammates who should receive renewal alerts and weekly digests.
          </p>
        </div>

        {/* Email chips + input */}
        <form onSubmit={handleAddEmail} className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {emails.map((e) => (
              <span
                key={e}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
              >
                <span>{e}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveEmail(e)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${e}`}
                >
                  ×
                </button>
              </span>
            ))}
            {emails.length === 0 && (
              <span className="text-xs text-muted-foreground">
                No recipients yet — add at least one, or you can use just your login
                email later.
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => {
                setError(null);
                setEmailInput(e.target.value);
              }}
              placeholder="teammate@company.com"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            />
            <button
              type="submit"
              className="mt-1 inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--accent)] sm:mt-0"
            >
              Add email
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            You can always edit these later in <span className="font-medium">Settings → Notifications</span>.
          </p>
        </form>

        {/* Toggles */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={prefs.renewalAlerts}
              onChange={(e) =>
                setPrefs((prev) =>
                  prev
                    ? { ...prev, renewalAlerts: e.target.checked }
                    : prev
                )
              }
            />
            <div>
              <p className="text-sm font-medium">Renewal alerts</p>
              <p className="text-xs text-muted-foreground">
                We&apos;ll email your recipients ahead of each contract&apos;s renewal date.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={prefs.weeklyDigest}
              onChange={(e) =>
                setPrefs((prev) =>
                  prev
                    ? { ...prev, weeklyDigest: e.target.checked }
                    : prev
                )
              }
            />
            <div>
              <p className="text-sm font-medium">Weekly digest</p>
              <p className="text-xs text-muted-foreground">
                A once-a-week summary of upcoming renewals and changes.
              </p>
            </div>
          </label>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
      </section>

      {/* Footer buttons */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          You&apos;ll be able to adjust these anytime from{" "}
          <span className="font-medium">Settings → Notifications</span>.
        </p>
        <button
          type="button"
          onClick={handleContinue}
          disabled={saving}
          className="inline-flex items-center rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Saving…" : "Save & continue to uploads"}
        </button>
      </div>
    </div>
  );
}
