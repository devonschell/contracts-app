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
  "/api/health",
  "/api/cron/(.*)",
  "/api/webhooks/(.*)",
  "/api/stripe/webhook",
]);

// Onboarding routes
const onboardingRoutes = createRouteMatcher([
  "/welcome",
  "/onboarding/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  const path = url.pathname;
  const { userId } = await auth();

  // Helper to always attach pathname header
  function withPathHeader(res: NextResponse) {
    res.headers.set("x-next-pathname", path);
    return res;
  }

  // === 1. Allow PUBLIC ROUTES
  if (isPublic(req)) {
    return withPathHeader(NextResponse.next());
  }

  // === 2. Block unauthenticated users
  if (!userId) {
    if (path.startsWith("/api/")) {
      return withPathHeader(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect_url", req.url);
    return withPathHeader(NextResponse.redirect(loginUrl));
  }

  // === 3. Subscription Check
  const sub = await prisma.userSubscription.findUnique({
    where: { clerkUserId: userId },
  });
  const hasActiveSub = sub?.status === "active";

  // Force billing page if no subscription
  if (!hasActiveSub && !path.startsWith("/settings/billing")) {
    return withPathHeader(
      NextResponse.redirect(new URL("/settings/billing", req.url))
    );
  }

  // === 4. Onboarding Check
  const company = await prisma.companyProfile.findUnique({
    where: { clerkUserId: userId },
  });

  const prefs = company
    ? await prisma.notificationPrefs.findUnique({
        where: { companyId: company.id },
      })
    : null;

  const hasBillingEmail = Boolean(company?.billingEmail);
  const hasRecipients =
    Boolean(prefs?.recipientsCsv) &&
    prefs!.recipientsCsv.trim().length > 0;

  const onboardingComplete = hasBillingEmail && hasRecipients;

  if (hasActiveSub && !onboardingComplete && !onboardingRoutes(req)) {
    return withPathHeader(
      NextResponse.redirect(new URL("/welcome", req.url))
    );
  }

  // === 5. Redirect "/" → dashboard
  if (path === "/") {
    return withPathHeader(
      NextResponse.redirect(new URL("/dashboard", req.url))
    );
  }

  // Default (authenticated route)
  return withPathHeader(NextResponse.next());
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api)(.*)"],
};
