import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId } = auth();
  const path = req.nextUrl.pathname;

  // ----- Public UI routes -----
  const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/sign-in",
    "/sign-up",
    "/favicon.ico",
  ];

  // ----- Public API routes -----
  const publicApiRoutes = [
    "/api/stripe/webhook",
    "/api/health",
    "/api/cron",
  ];

  const isApiRoute = path.startsWith("/api/");
  const isPublicRoute = publicRoutes.some((route) => path === route);
  const isPublicApiRoute = publicApiRoutes.some((route) => path === route);

  // Allow public pages + public APIs
  if (isPublicRoute || isPublicApiRoute) {
    return NextResponse.next();
  }

  // ----- Not logged in -----
  if (!userId) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // =====================================================
  //               DEV BYPASS — FIXED VERSION
  // =====================================================

  const devId = process.env.DEV_BYPASS_USER_ID; // <-- WORKS NOW
  const isDev = devId && userId === devId;

  if (isDev) {
    // Automatically subscribed, skip billing
    if (path === "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // =====================================================
  //           REAL USERS — CHECK SUBSCRIPTION
  // =====================================================

  const isBillingUI = path === "/billing";
  const isBillingApi =
    path === "/api/billing" || path.startsWith("/api/billing/");

  let subscribed = false;

  try {
    const origin = req.nextUrl.origin;

    // IMPORTANT: forward ALL cookies and headers
    const res = await fetch(`${origin}/api/billing`, {
      method: "GET",
      headers: {
        Cookie: req.headers.get("cookie") || "",
      },
    });

    const data = res.ok ? await res.json() : { subscribed: false };
    subscribed = !!data.subscribed;
  } catch (err) {
    console.error("Billing check failed in middleware:", err);
    subscribed = false;
  }

  // =====================================================
  //              UNSUBSCRIBED USERS
  // =====================================================

  if (!subscribed) {
    if (isBillingUI || isBillingApi) {
      return NextResponse.next();
    }

    if (!isApiRoute) {
      const url = req.nextUrl.clone();
      url.pathname = "/billing";
      return NextResponse.redirect(url);
    }

    return NextResponse.json({ error: "Payment required" }, { status: 402 });
  }

  // =====================================================
  //               SUBSCRIBED USERS
  // =====================================================

  if (path === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

// Next config
export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api)(.*)"],
};
