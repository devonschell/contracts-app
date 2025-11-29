// middleware.ts
import { clerkMiddleware, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const url = req.nextUrl;
  const path = url.pathname;

  // ---------- STATIC ASSETS (allow all) ----------
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
  const isDashboard = path === "/dashboard";

  const isAPI = path.startsWith("/api/");
  const isPublicAPI =
    path.startsWith("/api/stripe/webhook") ||
    path.startsWith("/api/health") ||
    path.startsWith("/api/billing");

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
  // 2) LOGGED-IN USERS → READ CLERK METADATA
  // =====================================================

  // Get metadata from session claims (set by Clerk)
  const metadata = sessionClaims?.metadata as {
    subscriptionStatus?: string;
    onboardingStep?: number;
  } | undefined;

  const subscriptionStatus = metadata?.subscriptionStatus ?? "inactive";
  const onboardingStep = metadata?.onboardingStep ?? 0;
  const isSubscribed = subscriptionStatus === "active";

  // =====================================================
  // 2A) LOGGED IN BUT NOT SUBSCRIBED
  // =====================================================
  if (!isSubscribed) {
    // Allow: billing page, public pages, billing API
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
  // 2B) LOGGED IN + SUBSCRIBED → ONBOARDING CHECK
  // =====================================================

  // Redirect away from public pages (subscribed users go to dashboard)
  if (isPublicPage) {
    const dashUrl = url.clone();
    dashUrl.pathname = "/dashboard";
    dashUrl.search = "";
    return NextResponse.redirect(dashUrl);
  }

  // Redirect away from billing (already subscribed)
  if (isBillingPage) {
    const dashUrl = url.clone();
    dashUrl.pathname = "/dashboard";
    dashUrl.search = "";
    return NextResponse.redirect(dashUrl);
  }

  // ---------- ONBOARDING FLOW ----------
  // Step 0 = not started (shouldn't happen if subscribed, but safety)
  // Step 1 = needs to complete /welcome
  // Step 2 = needs to upload first contract
  // Step 3 = complete, can access everything

  if (onboardingStep === 1) {
    // Must go to /welcome first
    if (!isWelcomePage && !isAPI) {
      const welcomeUrl = url.clone();
      welcomeUrl.pathname = "/welcome";
      welcomeUrl.search = "";
      return NextResponse.redirect(welcomeUrl);
    }
  }

  if (onboardingStep === 2) {
    // Must go to /upload after welcome
    if (!isUploadPage && !isWelcomePage && !isAPI) {
      const uploadUrl = url.clone();
      uploadUrl.pathname = "/upload";
      uploadUrl.search = "";
      return NextResponse.redirect(uploadUrl);
    }
  }

  // onboardingStep === 3 (or higher) → full access
  // Allow all app routes
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next|.*\\..*).*)",
    "/(api)(.*)",
  ],
};
