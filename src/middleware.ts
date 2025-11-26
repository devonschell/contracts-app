// src/middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId } = auth();
  const url = req.nextUrl;
  const path = url.pathname;

  // -----------------------------------------
  // PUBLIC ROUTES (match prefix ONLY)
  // -----------------------------------------
  const PUBLIC_PREFIXES = [
    "/login",
    "/signup",
    "/sign-in",
    "/sign-up",
    "/favicon.ico",
    "/api/stripe/webhook",
    "/api/health",
    "/api/cron",
  ];

  const isPublic = PUBLIC_PREFIXES.some((route) => path.startsWith(route));

  if (isPublic) {
    return NextResponse.next();
  }

  // -----------------------------------------
  // NOT LOGGED IN → redirect to clean /login
  // -----------------------------------------
  if (!userId) {
    const clean = new URL("/login", req.url);
    return NextResponse.redirect(clean);
  }

  // -----------------------------------------
  // DEV BYPASS
  // -----------------------------------------
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

  const isDev = bypassIds.includes(userId);

  if (isDev) {
    if (path === "/") {
      const dash = url.clone();
      dash.pathname = "/dashboard";
      return NextResponse.redirect(dash);
    }
    return NextResponse.next();
  }

  // -----------------------------------------
  // SUBSCRIPTION CHECK
  // -----------------------------------------
  const origin = url.origin;
  const isBillingUI = path.startsWith("/billing");
  const isBillingAPI = path.startsWith("/api/billing");

  let subscribed = false;
  try {
    const res = await fetch(`${origin}/api/billing`, {
      method: "GET",
      headers: { Cookie: req.headers.get("cookie") || "" },
    });
    const data = await res.json();
    subscribed = !!data.subscribed;
  } catch {
    subscribed = false;
  }

  // -----------------------------------------
  // NO SUBSCRIPTION → show billing page ONLY
  // -----------------------------------------
  if (!subscribed) {
    if (isBillingUI || isBillingAPI) return NextResponse.next();

    const bill = url.clone();
    bill.pathname = "/billing";
    bill.search = "";
    return NextResponse.redirect(bill);
  }

  // -----------------------------------------
  // SUBSCRIBED USERS: "/" → dashboard
  // -----------------------------------------
  if (path === "/") {
    const dash = url.clone();
    dash.pathname = "/dashboard";
    return NextResponse.redirect(dash);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api)(.*)"],
};
