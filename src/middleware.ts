import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId } = auth();
  const url = req.nextUrl;
  const path = url.pathname;

  // -----------------------------------------
  // PUBLIC ROUTES — NO AUTH, NO SUB CHECK
  // -----------------------------------------
  const PUBLIC_PREFIXES = [
    "/",                     // ← landing page must be public
    "/login",
    "/signup",
    "/sign-in",
    "/sign-up",
    "/favicon.ico",
    "/api/stripe/webhook",
    "/api/health",
    "/api/cron",
  ];

  const isPublic = PUBLIC_PREFIXES.some((route) =>
    path === route || path.startsWith(route)
  );

  if (isPublic) {
    return NextResponse.next();
  }

  // -----------------------------------------
  // NOT LOGGED IN → redirect to /login
  // -----------------------------------------
  if (!userId) {
    const cleanLogin = new URL("/login", req.url);
    return NextResponse.redirect(cleanLogin);
  }

  // -----------------------------------------
  // DEV BYPASS — SKIP BILLING + ONBOARDING
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
    // Dev lands on dashboard when visiting "/"
    if (path === "/") {
      const dash = url.clone();
      dash.pathname = "/dashboard";
      return NextResponse.redirect(dash);
    }

    // Dev can access EVERYTHING — skip billing
    return NextResponse.next();
  }

  // -----------------------------------------
  // REAL USERS → CHECK SUBSCRIPTION STATUS
  // -----------------------------------------
  const isBillingUI = path.startsWith("/billing");
  const isBillingAPI = path.startsWith("/api/billing");

  let subscribed = false;

  try {
    const res = await fetch(`${url.origin}/api/billing`, {
      method: "GET",
      headers: { Cookie: req.headers.get("cookie") || "" },
    });
    const data = await res.json();
    subscribed = !!data.subscribed;
  } catch {
    subscribed = false;
  }

  // -----------------------------------------
  // UNSUBSCRIBED USERS → force /billing
  // -----------------------------------------
  if (!subscribed) {
    // Allow them to access the billing pages + billing API
    if (isBillingUI || isBillingAPI) return NextResponse.next();

    // Block everything else
    const bill = url.clone();
    bill.pathname = "/billing";
    bill.search = "";
    return NextResponse.redirect(bill);
  }

  // -----------------------------------------
  // SUBSCRIBED USERS
  // "/" should go to /dashboard
  // -----------------------------------------
  if (path === "/") {
    const dash = url.clone();
    dash.pathname = "/dashboard";
    return NextResponse.redirect(dash);
  }

  return NextResponse.next();
});

// Ensure middleware applies everywhere except static assets
export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api)(.*)"],
};
