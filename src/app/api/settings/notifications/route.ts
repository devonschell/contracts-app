import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

// Helper: get or create a CompanyProfile and return its id
async function getOrCreateCompanyIdForUser(userId: string) {
  const existing = await prisma.companyProfile.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.companyProfile.create({
    data: { clerkUserId: userId },
    select: { id: true },
  });
  return created.id;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const company = await prisma.companyProfile.findUnique({
    where: { clerkUserId: userId },
    select: {
      id: true,
      renewalLeadDaysDefault: true,
      notificationPrefs: true,
    },
  });

  const defaults = {
    recipientsCsv: "",
    renewalAlerts: true,
    weeklyDigest: true,
    noticeDays: company?.renewalLeadDaysDefault ?? 30,
  };

  const prefs = company?.notificationPrefs
    ? {
        recipientsCsv: company.notificationPrefs.recipientsCsv,
        renewalAlerts: company.notificationPrefs.renewalAlerts,
        weeklyDigest: company.notificationPrefs.weeklyDigest,
        noticeDays: company.notificationPrefs.noticeDays,
      }
    : defaults;

  return NextResponse.json({ ok: true, data: prefs });
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const companyId = await getOrCreateCompanyIdForUser(userId);

  const body = await req.json().catch(() => ({}));
  let recipientsCsv = String(body?.recipientsCsv ?? "");
  const renewalAlerts = Boolean(body?.renewalAlerts ?? true);
  const weeklyDigest = Boolean(body?.weeklyDigest ?? true);
  const noticeDaysNum = Number(body?.noticeDays ?? "");

  if (!Number.isFinite(noticeDaysNum) || noticeDaysNum < 1 || noticeDaysNum > 365) {
    return NextResponse.json(
      { ok: false, error: "noticeDays must be 1–365" },
      { status: 400 }
    );
  }

  const recipients = recipientsCsv
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);
  recipientsCsv = recipients.join(",");

  const prefs = await prisma.notificationPrefs.upsert({
    where: { companyId },
    update: {
      recipientsCsv,
      renewalAlerts,
      weeklyDigest,
      noticeDays: noticeDaysNum,
    },
    create: {
      companyId,
      recipientsCsv,
      renewalAlerts,
      weeklyDigest,
      noticeDays: noticeDaysNum,
    },
  });

  // 🔥 Mark onboarding step >= 1 (notifications configured)
  const existingSettings = await prisma.userSettings.findUnique({
    where: { clerkUserId: userId },
    select: { onboardingStep: true },
  });

  const currentStep = existingSettings?.onboardingStep ?? 0;
  const nextStep = currentStep >= 1 ? currentStep : 1;

  await prisma.userSettings.upsert({
    where: { clerkUserId: userId },
    update: { onboardingStep: nextStep },
    create: {
      clerkUserId: userId,
      onboardingStep: nextStep,
    },
  });

  return NextResponse.json({
    ok: true,
    data: {
      recipientsCsv: prefs.recipientsCsv,
      renewalAlerts: prefs.renewalAlerts,
      weeklyDigest: prefs.weeklyDigest,
      noticeDays: prefs.noticeDays,
    },
  });
}
