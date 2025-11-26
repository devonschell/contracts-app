// src/middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId } = auth();
  const path = req.nextUrl.pathname;

  // ------------------------------------
  // PUBLIC ROUTES (do not require auth)
  // ------------------------------------
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

  // ------------------------------------
  // NOT LOGGED IN → redirect to /login
  // ------------------------------------
  if (!userId) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ❗ IMPORTANT: Do NOT use redirect_url — this caused your redirect loop
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ------------------------------------
  // DEV BYPASS (multiple users supported)
  // ------------------------------------
  const bypassIds: string[] = [];

  if (process.env.DEV_BYPASS_USER_ID) {
    bypassIds.push(process.env.DEV_BYPASS_USER_ID.trim());
  }

  if (process.env.DEV_BYPASS_USER_IDS) {
    bypassIds.push(
      ...process.env.DEV_BYPASS_USER_IDS.split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    );
  }

  const isDevBypass = bypassIds.includes(userId);

  if (isDevBypass) {
    // Devs always land on dashboard from "/" 
    if (path === "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Dev bypass skips subscription completely
    return NextResponse.next();
  }

  // ------------------------------------
  // REAL USERS → CHECK SUBSCRIPTION
  // ------------------------------------
  const isBillingUI = path === "/billing" || path.startsWith("/billing/");
  const isBillingApi =
    path === "/api/billing" || path.startsWith("/api/billing/");

  let subscribed = false;

  try {
    const origin = req.nextUrl.origin;
    const res = await fetch(`${origin}/api/billing`, {
      method: "GET",
      headers: { Cookie: req.headers.get("cookie") || "" },
    });
    const data = res.ok ? await res.json() : { subscribed: false };
    subscribed = !!data.subscribed;
  } catch (err) {
    console.error("Billing check failed:", err);
    subscribed = false;
  }

  // ------------------------------------
  // UNSUBSCRIBED USERS → force /billing
  // ------------------------------------
  if (!subscribed) {
    // Allow billing screens & billing API
    if (isBillingUI || isBillingApi) {
      return NextResponse.next();
    }

    // Block all other pages
    if (isApiRoute) {
      return NextResponse.json({ error: "Payment required" }, { status: 402 });
    }

    const url = req.nextUrl.clone();
    url.pathname = "/billing";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // ------------------------------------
  // SUBSCRIBED USERS: "/" → dashboard
  // ------------------------------------
  if (path === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Everything else allowed
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api)(.*)",
  ],
};
