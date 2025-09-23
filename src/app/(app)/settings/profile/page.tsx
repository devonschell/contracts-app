import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const { userId } = await auth();
  if (!userId) return <div className="p-6">Please sign in.</div>;

  const row = await prisma.companyProfile.findUnique({
    where: { clerkUserId: userId },
    select: {
      companyName: true,
      timezone: true,
      currency: true,
      renewalLeadDaysDefault: true,
    },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Profile</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <ProfileForm
          initial={{
            companyName: row?.companyName ?? "",
            timezone: row?.timezone ?? "America/New_York",
            currency: row?.currency ?? "USD",
            renewalLeadDaysDefault:
              typeof row?.renewalLeadDaysDefault === "number" ? row!.renewalLeadDaysDefault : 45,
          }}
        />
        <p className="mt-3 text-xs text-slate-500">
          We use your company name to detect which party in a contract is “you” and set the other as
          the counterparty automatically.
        </p>
      </div>
    </div>
  );
}
