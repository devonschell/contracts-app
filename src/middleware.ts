// middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Dev bypass users - skip all subscription/onboarding checks
const DEV_BYPASS_USER_IDS = (process.env.DEV_BYPASS_USER_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = req.nextUrl;
  const path = url.pathname;

  // ---------- STATIC ASSETS (always allow) ----------
  const isStatic =
    path.startsWith("/_next") ||
    path.startsWith("/favicon.ico") ||
    path.match(/\.[a-zA-Z0-9]+$/);

  if (isStatic) return NextResponse.next();

  // ---------- AUTH ROUTES (Public) ----------
  // MUST allow all nested Clerk routes:
  // /signup
  // /signup/*
  // /login
  // /login/*
  const isAuthRoute =
    path.startsWith("/login") ||
    path.startsWith("/sign-in") ||
    path.startsWith("/signup") ||
    path.startsWith("/sign-up");

  const isRoot = path === "/";

  const isBillingPage =
    path === "/billing" ||
    path.startsWith("/billing") ||
    path === "/settings/billing" ||
    path.startsWith("/settings/billing");

  const isWelcomePage = path === "/welcome";

  const isAPI = path.startsWith("/api/");

  const isPublicAPI =
    path.startsWith("/api/stripe/webhook") ||
    path.startsWith("/api/health") ||
    path.startsWith("/api/billing") ||
    path.startsWith("/api/user-status");

  const isPublicPage = isRoot || isAuthRoute;

  // ---------- PUBLIC APIs (always allow) ----------
  if (isPublicAPI) return NextResponse.next();

  // =====================================================
  // 1) LOGGED-OUT USERS
  // =====================================================
  if (!userId) {
    if (isPublicPage) return NextResponse.next();

    if (isAPI) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = url.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  // =====================================================
  // 🔥 DEV BYPASS USERS
  // =====================================================
  const isBypassUser = DEV_BYPASS_USER_IDS.includes(userId);

  if (isBypassUser) {
    if (isPublicPage || isBillingPage) {
      const dashUrl = url.clone();
      dashUrl.pathname = "/dashboard";
      dashUrl.search = "";
      return NextResponse.redirect(dashUrl);
    }
    return NextResponse.next();
  }

  // =====================================================
  // 2) LOGGED-IN USERS → CHECK SUBSCRIPTION
  // =====================================================
  let isSubscribed = false;
  let onboardingStep = 0;

  try {
    const res = await fetch(`${url.origin}/api/user-status`, {
      method: "GET",
      headers: {
        Cookie: req.headers.get("cookie") || "",
      },
    });

    if (res.ok) {
      const data = await res.json();
      isSubscribed = data.isSubscribed === true;
      onboardingStep = data.onboardingStep ?? 0;
    }
  } catch (err) {
    console.error("Middleware: Failed to fetch user status", err);
    isSubscribed = false;
    onboardingStep = 0;
  }

  // =====================================================
  // 2A) LOGGED IN BUT NOT SUBSCRIBED
  // =====================================================
  if (!isSubscribed) {
    if (isBillingPage || isPublicPage) return NextResponse.next();

    if (isAPI) {
      return NextResponse.json({ error: "Payment required" }, { status: 402 });
    }

    const billingUrl = url.clone();
    billingUrl.pathname = "/billing";
    billingUrl.search = "";
    return NextResponse.redirect(billingUrl);
  }

  // =====================================================
  // 2B) LOGGED IN + SUBSCRIBED
  // =====================================================
  if (isPublicPage) {
    const dashUrl = url.clone();
    dashUrl.pathname = "/dashboard";
    dashUrl.search = "";
    return NextResponse.redirect(dashUrl);
  }

  if (isBillingPage) {
    const dashUrl = url.clone();
    dashUrl.pathname = "/dashboard";
    dashUrl.search = "";
    return NextResponse.redirect(dashUrl);
  }

  if (isAPI) return NextResponse.next();

  // =====================================================
  // 2C) ONBOARDING FLOW
  // =====================================================
  if (onboardingStep === 1 && !isWelcomePage) {
    const welcomeUrl = url.clone();
    welcomeUrl.pathname = "/welcome";
    welcomeUrl.search = "";
    return NextResponse.redirect(welcomeUrl);
  }

  // Step 2 and 3 → allow everything
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api)(.*)",
  ],
};
