import Link from "next/link";
import PageContainer from "@/components/PageContainer";

export const dynamic = "force-dynamic";

export default function SettingsHome() {
  return (
    <PageContainer
      title="Settings"
      description="Manage your company profile, notifications, and billing details."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Profile */}
        <Link
          href="/settings/profile"
          className="rounded-lg border border-border bg-card p-4 shadow-sm transition hover:shadow-md"
        >
          <div className="text-sm font-semibold text-foreground">Profile</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Company name, billing email, timezone, currency, and default renewal lead days.
          </div>
        </Link>

        {/* Notifications */}
        <Link
          href="/settings/notifications"
          className="rounded-lg border border-border bg-card p-4 shadow-sm transition hover:shadow-md"
        >
          <div className="text-sm font-semibold text-foreground">Notifications</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Who gets renewal reminders and how often (coming soon).
          </div>
        </Link>

        {/* Billing */}
        <Link
          href="/settings/billing"
          className="rounded-lg border border-border bg-card p-4 shadow-sm transition hover:shadow-md sm:col-span-2 lg:col-span-1"
        >
          <div className="text-sm font-semibold text-foreground">Billing</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Plan, payment method, and invoices (coming soon).
          </div>
        </Link>
      </div>
    </PageContainer>
  );
}
