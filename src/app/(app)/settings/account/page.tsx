"use client";
import { UserProfile } from "@clerk/nextjs";

export default function AccountSettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-4">
        <div className="text-sm text-slate-500">Settings</div>
        <h1 className="mt-1 text-2xl font-semibold">Account & Security</h1>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <UserProfile routing="hash" />
      </div>
    </div>
  );
}
