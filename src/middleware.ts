// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const PUBLIC_AUTH = createRouteMatcher([
  "/login(.*)",
  "/signup(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/oauth-callback(.*)",
  "/auth-callback(.*)",
  "/favicon.ico",
  "/api/health",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = req.nextUrl;
  const path = url.pathname;

  // DEV BYPASS — you can toggle
  const DEV_BYPASS =
    process.env.NODE_ENV === "development" &&
    userId === process.env.NEXT_PUBLIC_DEV_USER_ID;

  const send = (res: NextResponse) => {
    res.headers.set("x-next-pathname", path);
    return res;
  };

  // 1. Landing page logic
  if (path === "/") {
    if (!userId) return send(NextResponse.next()); // show landing
    // logged in: go to dashboard or billing
    const sub = await prisma.userSubscription.findUnique({
      where: { clerkUserId: userId },
      select: { status: true },
    });
    if (!sub || sub.status !== "active") {
      return send(NextResponse.redirect(new URL("/settings/billing", req.url)));
    }
    return send(NextResponse.redirect(new URL("/dashboard", req.url)));
  }

  // 2. Public routes
  if (!userId && PUBLIC_AUTH(req)) {
    return send(NextResponse.next());
  }

  // 3. Must be logged in
  if (!userId) {
    const login = new URL("/login", req.url);
    login.searchParams.set("redirect_url", req.url);
    return send(NextResponse.redirect(login));
  }

  // 4. Dev bypass ignores subscription + onboarding
  if (DEV_BYPASS) return send(NextResponse.next());

  // 5. Subscription required
  const sub = await prisma.userSubscription.findUnique({
    where: { clerkUserId: userId },
    select: { status: true },
  });

  const hasActive = sub?.status === "active";

  if (!hasActive && !path.startsWith("/settings/billing")) {
    return send(NextResponse.redirect(new URL("/settings/billing", req.url)));
  }

  // 6. Onboarding check
  const company = await prisma.companyProfile.findUnique({
    where: { clerkUserId: userId },
  });

  const prefs = company
    ? await prisma.notificationPrefs.findUnique({
        where: { companyId: company.id },
      })
    : null;

  const onboardingDone =
    Boolean(company?.billingEmail) &&
    Boolean(prefs?.recipientsCsv?.trim());

  if (hasActive && !onboardingDone && !path.startsWith("/welcome")) {
    return send(NextResponse.redirect(new URL("/welcome", req.url)));
  }

  return send(NextResponse.next());
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api)(.*)"],
};
