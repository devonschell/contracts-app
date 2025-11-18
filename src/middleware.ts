// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Public routes (no auth required)
const isPublic = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/favicon.ico",

  // Health + cron + webhooks
  "/api/health",
  "/api/cron/(.*)",
  "/api/webhooks/(.*)",
  "/api/stripe/webhook",
]);

// Onboarding routes allowed even without full app access
const onboardingRoutes = createRouteMatcher([
  "/welcome",
  "/onboarding/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  const path = url.pathname;

  const { userId } = await auth();

  // 1. Allow public routes immediately
  if (isPublic(req)) return;

  // 2. Require login for everything else
  if (!userId) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // ------------------------------
  // 3. Check subscription status
  // ------------------------------
  const sub = await prisma.userSubscription.findUnique({
    where: { clerkUserId: userId },
  });

  const hasActiveSub = sub && sub.status === "active";

  // If no subscription → always force to billing page
  if (!hasActiveSub && !path.startsWith("/settings/billing")) {
    return NextResponse.redirect(new URL("/settings/billing", req.url));
  }

  // ------------------------------
  // 4. Check onboarding completion
  // ------------------------------
  const company = await prisma.companyProfile.findUnique({
    where: { clerkUserId: userId },
  });

  const onboardingComplete =
    company?.billingEmail &&
    company?.notificationEmails &&
    Array.isArray(company.notificationEmails) &&
    company.notificationEmails.length > 0;

  // If subscription exists but onboarding is incomplete → force into onboarding
  if (hasActiveSub && !onboardingComplete && !onboardingRoutes(req)) {
    return NextResponse.redirect(new URL("/welcome", req.url));
  }

  // 5. If signed in & hits "/", redirect to dashboard
  if (path === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return;
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api)(.*)"],
};
