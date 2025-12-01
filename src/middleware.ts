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

  // ---------- ROUTE DEFINITIONS ----------
  const AUTH_ROUTES = ["/login", "/signup", "/sign-in", "/sign-up"];
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );

  const isRoot = path === "/";
  const isBillingPage = path === "/billing" || path.startsWith("/billing");
  const isWelcomePage = path === "/welcome";
  const isUploadPage = path === "/upload";

  const isAPI = path.startsWith("/api/");

  // Public APIs that don't require auth
  const isPublicAPI =
    path.startsWith("/api/stripe/webhook") ||
    path.startsWith("/api/health") ||
    path.startsWith("/api/billing") ||
    path.startsWith("/api/user-status");

  const isPublicPage = isRoot || isAuthRoute;

  // ---------- PUBLIC APIs (always allow) ----------
  if (isPublicAPI) {
    return NextResponse.next();
  }

  // =====================================================
  // 1) LOGGED-OUT USERS
  // =====================================================
  if (!userId) {
    // Allow: landing, login, signup
    if (isPublicPage) return NextResponse.next();

    // Block API routes with 401
    if (isAPI) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Everything else → redirect to /login
    const loginUrl = url.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  // =====================================================
  // 🔥 DEV BYPASS - Skip all checks for bypass users
  // =====================================================
  const isBypassUser = DEV_BYPASS_USER_IDS.includes(userId);

  if (isBypassUser) {
    // Bypass users should go straight to dashboard from public pages
    if (isPublicPage || isBillingPage) {
      const dashUrl = url.clone();
      dashUrl.pathname = "/dashboard";
      dashUrl.search = "";
      return NextResponse.redirect(dashUrl);
    }
    // Allow everything else
    return NextResponse.next();
  }

  // =====================================================
  // 2) LOGGED-IN USERS → CHECK SUBSCRIPTION VIA API
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
    // Allow: billing page, public pages
    if (isBillingPage || isPublicPage) {
      return NextResponse.next();
    }

    // Block other APIs with 402 Payment Required
    if (isAPI) {
      return NextResponse.json({ error: "Payment required" }, { status: 402 });
    }

    // Everything else → redirect to /billing
    const billingUrl = url.clone();
    billingUrl.pathname = "/billing";
    billingUrl.search = "";
    return NextResponse.redirect(billingUrl);
  }

  // =====================================================
  // 2B) LOGGED IN + SUBSCRIBED
  // =====================================================

  // Redirect away from public pages (subscribed users go to dashboard)
  if (isPublicPage) {
    const dashUrl = url.clone();
    dashUrl.pathname = "/dashboard";
    dashUrl.search = "";
    return NextResponse.redirect(dashUrl);
  }

  // Redirect away from billing page (already subscribed)
  if (isBillingPage) {
    const dashUrl = url.clone();
    dashUrl.pathname = "/dashboard";
    dashUrl.search = "";
    return NextResponse.redirect(dashUrl);
  }

  // =====================================================
  // 2C) ONBOARDING FLOW (only for subscribed users)
  // =====================================================

  // Allow all API routes for subscribed users
  if (isAPI) {
    return NextResponse.next();
  }

  // Step 1: Must complete /welcome first
  if (onboardingStep === 1 && !isWelcomePage) {
    const welcomeUrl = url.clone();
    welcomeUrl.pathname = "/welcome";
    welcomeUrl.search = "";
    return NextResponse.redirect(welcomeUrl);
  }

  // Step 2: Must complete /upload after welcome
  if (onboardingStep === 2 && !isUploadPage && !isWelcomePage) {
    const uploadUrl = url.clone();
    uploadUrl.pathname = "/upload";
    uploadUrl.search = "";
    return NextResponse.redirect(uploadUrl);
  }

  // Step 3+: Full access to everything
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api)(.*)",
  ],
};
