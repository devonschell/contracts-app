import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import CompanyNameForm from "./CompanyNameForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) return <div className="p-6">Please sign in.</div>;

  const row = await prisma.companyProfile.findUnique({
    where: { clerkUserId: userId },
    select: {
      companyName: true,
      billingEmail: true,
      timezone: true,
      currency: true,
      renewalLeadDaysDefault: true,
    },
  });

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-2 text-sm font-semibold text-slate-800">Profile</div>
        <CompanyNameForm
          initial={row?.companyName ?? ""}
          initialBillingEmail={row?.billingEmail ?? ""}
          initialTimezone={row?.timezone ?? ""}
          initialCurrency={row?.currency ?? ""}
          initialRenewalLeadDays={row?.renewalLeadDaysDefault ?? null}
        />
        <p className="mt-3 text-xs text-slate-500">
          We use your company name to detect which party in a contract is “you” and set the other as the counterparty.
        </p>
      </div>
    </div>
  );
}
