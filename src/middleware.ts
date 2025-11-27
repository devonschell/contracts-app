import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId } = auth();
  const url = req.nextUrl;
  const path = url.pathname;

  // ----------------------------
  // ROUTE GROUPS
  // ----------------------------
  const AUTH_ROUTES = ["/login", "/signup", "/sign-in", "/sign-up"];
  const isAuthRoute = AUTH_ROUTES.some((r) => path === r || path.startsWith(r));

  const isRoot = path === "/";
  const isBillingUI = path.startsWith("/billing");
  const isBillingAPI = path.startsWith("/api/billing");
  const isSettings = path.startsWith("/settings"); // NEW

  const isPublicEndpoint =
    path.startsWith("/api/stripe/webhook") ||
    path.startsWith("/api/health") ||
    path.startsWith("/api/cron");

  const isStatic =
    path.startsWith("/_next") ||
    path.startsWith("/favicon.ico") ||
    path.match(/\.[a-zA-Z0-9]+$/);

  // ----------------------------
  // ALWAYS PUBLIC (STATIC + WEBHOOKS)
  // ----------------------------
  if (isStatic || isPublicEndpoint) return NextResponse.next();

  // ----------------------------
  // LOGGED OUT USERS
  // ----------------------------
  if (!userId) {
    // Landing + login/signup allowed
    if (isRoot || isAuthRoute) return NextResponse.next();

    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const login = url.clone();
    login.pathname = "/login";
    login.search = "";
    return NextResponse.redirect(login);
  }

  // ----------------------------
  // DEV BYPASS
  // ----------------------------
  const bypassIds: string[] = [];
  if (process.env.DEV_BYPASS_USER_ID)
    bypassIds.push(process.env.DEV_BYPASS_USER_ID.trim());
  if (process.env.DEV_BYPASS_USER_IDS)
    bypassIds.push(
      ...process.env.DEV_BYPASS_USER_IDS.split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    );

  const isDev = bypassIds.includes(userId);
  if (isDev) {
    if (isRoot || isAuthRoute) {
      const dash = url.clone();
      dash.pathname = "/dashboard";
      return NextResponse.redirect(dash);
    }
    return NextResponse.next();
  }

  // ----------------------------
  // REAL USER → CHECK SUB
  // ----------------------------
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

  // ----------------------------
  // LOGGED IN BUT NOT SUBSCRIBED
  // ----------------------------
  if (!subscribed) {
    // Billing + billing API allowed
    if (isBillingUI || isBillingAPI) return NextResponse.next();

    // Landing allowed (marketing page)
    if (isRoot) return NextResponse.next();

    // Login/Signup clicked while logged-in → send to billing
    if (isAuthRoute) {
      const bill = url.clone();
      bill.pathname = "/billing";
      return NextResponse.redirect(bill);
    }

    // Settings requires subscription
    if (isSettings) {
      const bill = url.clone();
      bill.pathname = "/billing";
      return NextResponse.redirect(bill);
    }

    // Everything else (dashboard, upload, contracts, etc.) → billing
    const bill = url.clone();
    bill.pathname = "/billing";
    return NextResponse.redirect(bill);
  }

  // ----------------------------
  // LOGGED IN + SUBSCRIBED
  // ----------------------------
  // Never show landing or login/signup
  if (isRoot || isAuthRoute) {
    const dash = url.clone();
    dash.pathname = "/dashboard";
    return NextResponse.redirect(dash);
  }

  // Everything else allowed
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api)(.*)"],
};
