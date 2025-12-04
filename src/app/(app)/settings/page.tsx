"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import PageContainer from "@/components/PageContainer";

type NotificationPrefs = {
  recipientsCsv: string;
  renewalAlerts: boolean;
  weeklyDigest: boolean;
  noticeDays: number;
};

type CompanyProfile = {
  companyName: string;
  billingEmail: string;
  timezone: string;
};

export default function SettingsPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "billing">(
    "profile"
  );
  const [saving, setSaving] = useState(false);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Profile state ------------------------------------------
  const [profile, setProfile] = useState<CompanyProfile>({
    companyName: "",
    billingEmail: user?.primaryEmailAddress?.emailAddress || "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  // Notifications state ------------------------------------
  const [notifications, setNotifications] = useState<NotificationPrefs>({
    recipientsCsv: "",
    renewalAlerts: true,
    weeklyDigest: true,
    noticeDays: 30,
  });

  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");

  // Load data on mount -------------------------------------
  useEffect(() => {
    fetch("/api/settings/company")
      .then((r) => r.json())
      .then((data) => {
        if (data?.data) {
          setProfile({
            companyName: data.data.companyName || "",
            billingEmail:
              data.data.billingEmail || user?.primaryEmailAddress?.emailAddress || "",
            timezone:
              data.data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          });
        }
      })
      .catch(console.error);

    fetch("/api/settings/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (data?.data) {
          setNotifications(data.data);
          const existingEmails = data.data.recipientsCsv
            ? data.data.recipientsCsv.split(",").map((e: string) => e.trim())
            : [];
          setEmails(existingEmails);
        }
      })
      .catch(console.error);
  }, [user]);

  // Save profile -------------------------------------------
  async function saveProfile() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMessage({ type: "success", text: "Profile saved!" });
    } catch {
      setMessage({ type: "error", text: "Failed to save profile" });
    } finally {
      setSaving(false);
    }
  }

  // Save notifications -------------------------------------
  async function saveNotifications() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...notifications,
          recipientsCsv: emails.join(", "),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMessage({ type: "success", text: "Notification settings saved!" });
    } catch {
      setMessage({ type: "error", text: "Failed to save notifications" });
    } finally {
      setSaving(false);
    }
  }

  // Billing Portal Handler ---------------------------------
  async function handleBillingAction() {
    setLoadingBilling(true);

    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "portal" }),
    });

    const data = await res.json();
    setLoadingBilling(false);

    if (data.url) window.location.href = data.url;
  }

  // Email Add / Remove -------------------------------------
  function handleAddEmail() {
    const raw = emailInput.trim();
    if (!raw || !raw.includes("@") || emails.includes(raw)) return;
    setEmails((prev) => [...prev, raw]);
    setEmailInput("");
  }

  function handleRemoveEmail(target: string) {
    setEmails((prev) => prev.filter((e) => e !== target));
  }

  // Tabs ----------------------------------------------------
  const tabs = [
    { id: "profile" as const, label: "Profile" },
    { id: "notifications" as const, label: "Notifications" },
    { id: "billing" as const, label: "Billing" },
  ];

  return (
    <PageContainer title="Settings" description="Manage your OVIU account and preferences.">
      {/* TAB SELECTOR ---------------------------------------- */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMessage(null);
              }}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ALERT MESSAGE ---------------------------------------- */}
      {message && (
        <div
          className={`mb-6 p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* PROFILE TAB ----------------------------------------- */}
      {activeTab === "profile" && (
        <div className="max-w-xl space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Company Profile</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name</label>
              <input
                type="text"
                value={profile.companyName}
                onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Billing Email</label>
              <input
                type="email"
                value={profile.billingEmail}
                onChange={(e) => setProfile({ ...profile, billingEmail: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground">Receipts and billing notices will be sent here.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Timezone</label>
              <select
                value={profile.timezone}
                onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS TAB ----------------------------------- */}
      {activeTab === "notifications" && (
        <div className="max-w-xl space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <h2 className="text-lg font-semibold">Email Notifications</h2>

            {/* Toggles */}
            <div className="space-y-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 mt-1"
                  checked={notifications.renewalAlerts}
                  onChange={(e) =>
                    setNotifications({ ...notifications, renewalAlerts: e.target.checked })
                  }
                />
                <div>
                  <p className="text-sm font-medium">Renewal alerts</p>
                  <p className="text-xs text-muted-foreground">
                    Get notified 90, 60, and 30 days before a contract renews.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 mt-1"
                  checked={notifications.weeklyDigest}
                  onChange={(e) =>
                    setNotifications({ ...notifications, weeklyDigest: e.target.checked })
                  }
                />
                <div>
                  <p className="text-sm font-medium">Weekly digest</p>
                  <p className="text-xs text-muted-foreground">
                    Monday summary of renewals, upcoming tasks, and contract activity.
                  </p>
                </div>
              </label>
            </div>

            {/* Notice period */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Default notice period</label>
              <select
                value={notifications.noticeDays}
                onChange={(e) =>
                  setNotifications({ ...notifications, noticeDays: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>

            {/* Recipients */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Notification recipients</label>

              <div className="flex flex-wrap gap-2">
                {emails.map((e) => (
                  <span
                    key={e}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
                  >
                    {e}
                    <button
                      onClick={() => handleRemoveEmail(e)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {emails.length === 0 && (
                  <span className="text-xs text-muted-foreground">No recipients added.</span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddEmail())}
                  placeholder="teammate@company.com"
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
                <button
                  onClick={handleAddEmail}
                  className="rounded-lg bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/80"
                >
                  Add
                </button>
              </div>
            </div>

            <button
              onClick={saveNotifications}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* BILLING TAB ----------------------------------------- */}
      {activeTab === "billing" && (
        <div className="max-w-xl space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Subscription</h2>
            <p className="text-sm text-muted-foreground">
              Manage your subscription, payment methods, invoices, and plan upgrades.
            </p>

            <button
              onClick={handleBillingAction}
              disabled={loadingBilling}
              className="w-full rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition"
            >
              {loadingBilling ? "Loading…" : "Manage Billing"}
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
