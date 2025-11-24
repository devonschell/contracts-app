// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Public — no auth required
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

// Onboarding steps
const onboardingRoutes = createRouteMatcher([
  "/welcome(.*)",
  "/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = req.nextUrl;
  const path = url.pathname;

  // Attach pathname to headers
  const withPath = (res: NextResponse) => {
    res.headers.set("x-next-pathname", path);
    return res;
  };

  // 1. Public pages allowed
  if (isPublic(req)) return withPath(NextResponse.next());

  // 2. Require login for everything else
  if (!userId) {
    const login = new URL("/login", req.url);
    login.searchParams.set("redirect_url", req.url);
    return withPath(NextResponse.redirect(login));
  }

  // 3. Subscription check
  const sub = await prisma.userSubscription.findUnique({
    where: { clerkUserId: userId },
  });
  const hasActiveSub = sub?.status === "active";

  if (!hasActiveSub && !path.startsWith("/settings/billing")) {
    return withPath(NextResponse.redirect(new URL("/settings/billing", req.url)));
  }

  // 4. Onboarding check
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
    Boolean(prefs?.recipientsCsv) && prefs!.recipientsCsv.trim().length > 0;

  const onboardingComplete = hasBillingEmail && hasRecipients;

  if (hasActiveSub && !onboardingComplete && !onboardingRoutes(req)) {
    return withPath(NextResponse.redirect(new URL("/welcome", req.url)));
  }

  // 5. Signed in → "/" should go to dashboard
  if (path === "/") {
    return withPath(NextResponse.redirect(new URL("/dashboard", req.url)));
  }

  // 6. Default allow
  return withPath(NextResponse.next());
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api)(.*)"],
};
