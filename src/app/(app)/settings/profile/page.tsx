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
      billingEmail: true,
      timezone: true,
      currency: true,
      renewalLeadDaysDefault: true,
    },
  });

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold mb-4">Profile</h1>
      <ProfileForm
        initial={{
          companyName: row?.companyName ?? "",
          billingEmail: row?.billingEmail ?? "",
          timezone: row?.timezone ?? "",
          currency: row?.currency ?? "USD",
          renewalLeadDaysDefault:
            typeof row?.renewalLeadDaysDefault === "number" ? row!.renewalLeadDaysDefault : undefined,
        }}
      />
      <p className="mt-3 text-xs text-slate-500">
        We use your company name to detect which party in a contract is “you” and set the other as the counterparty.
      </p>
    </div>
  );
}
