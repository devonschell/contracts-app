import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import CompanyNameForm from "./CompanyNameForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) return <div className="p-6">Please sign in.</div>;

  const row = await prisma.companyProfile.findUnique({
    where: { clerkUserId: userId },
    select: { companyName: true },
  });

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-2 text-sm font-semibold text-slate-800">Company profile</div>
        <CompanyNameForm initial={row?.companyName ?? ""} />
        <p className="mt-3 text-xs text-slate-500">
          We use your company name to tell which party in a contract is “you” (provider or customer),
          and set the other party as the counterparty automatically.
        </p>
      </div>
    </div>
  );
}
