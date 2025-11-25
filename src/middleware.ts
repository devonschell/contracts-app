// src/middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId } = auth();
  const path = req.nextUrl.pathname;

  // ----------------------------
  // PUBLIC ROUTES
  // ----------------------------
  const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/sign-in",
    "/sign-up",
    "/favicon.ico",
  ];

  const publicApiRoutes = [
    "/api/stripe/webhook",
    "/api/health",
    "/api/cron",
  ];

  const isApiRoute = path.startsWith("/api/");
  const isPublicRoute = publicRoutes.some(
    (route) => path === route || path.startsWith(route + "/")
  );
  const isPublicApiRoute = publicApiRoutes.some(
    (route) => path === route || path.startsWith(route + "/")
  );

  if (isPublicRoute || isPublicApiRoute) {
    return NextResponse.next();
  }

  // ----------------------------
  // NOT LOGGED IN
  // ----------------------------
  if (!userId) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // ----------------------------
  // MULTI-USER DEV BYPASS
  // ----------------------------
  const bypassList = (process.env.DEV_BYPASS_USER_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const isDevBypass = bypassList.includes(userId);

  if (isDevBypass) {
    // If dev hits "/", push to dashboard automatically
    if (path === "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Skip Stripe entirely
    return NextResponse.next();
  }

  // ----------------------------
  // REAL USERS — CHECK SUBSCRIPTION
  // ----------------------------
  const isBillingUI = path.startsWith("/billing");
  const isBillingApi = path.startsWith("/api/billing");

  let subscribed = false;

  try {
    const origin = req.nextUrl.origin;

    const res = await fetch(`${origin}/api/billing`, {
      method: "GET",
      headers: {
        Cookie: req.headers.get("cookie") || "",
      },
    });

    const data = res.ok ? await res.json() : { subscribed: false };
    subscribed = !!data.subscribed;
  } catch (err) {
    console.error("Billing check failed:", err);
    subscribed = false;
  }

  // UNSUBSCRIBED USERS
  if (!subscribed) {
    // Allow billing pages
    if (isBillingUI || isBillingApi) {
      return NextResponse.next();
    }

    const url = req.nextUrl.clone();
    url.pathname = "/billing";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // SUBSCRIBED USERS: landing → dashboard
  if (path === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api)(.*)",
  ],
};
