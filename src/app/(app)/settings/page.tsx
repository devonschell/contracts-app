// src/app/(app)/settings/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function SettingsHome() {
  return (
    <div className="space-y-6">
      {/* Hide the visual heading to avoid duplicate with layout; keep for a11y */}
      <h1 className="sr-only">Settings</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/settings/profile"
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow"
        >
          <div className="text-sm font-semibold text-slate-900">Profile</div>
          <div className="mt-1 text-sm text-slate-600">
            Company name, billing email, timezone, currency, and default renewal lead days.
          </div>
        </Link>

        <Link
          href="/settings/notifications"
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow"
        >
          <div className="text-sm font-semibold text-slate-900">Notifications</div>
          <div className="mt-1 text-sm text-slate-600">
            Who gets renewal reminders and how often (coming soon).
          </div>
        </Link>

        <Link
          href="/settings/billing"
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow sm:col-span-2 lg:col-span-1"
        >
          <div className="text-sm font-semibold text-slate-900">Billing</div>
          <div className="mt-1 text-sm text-slate-600">
            Plan, payment method, and invoices (coming soon).
          </div>
        </Link>
      </div>
    </div>
  );
}
