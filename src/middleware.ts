// middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId } = auth();
  const url = req.nextUrl;
  const path = url.pathname;

  // ---------- STATIC ASSETS ----------
  const isStatic =
    path.startsWith("/_next") ||
    path.startsWith("/favicon.ico") ||
    path.match(/\.[a-zA-Z0-9]+$/);

  if (isStatic) return NextResponse.next();

  // ---------- ROUTE GROUPS ----------
  const AUTH_ROUTES = ["/login", "/signup", "/sign-in", "/sign-up"];
  // treat /login/sso-callback etc as auth routes too
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );

  const isRoot = path === "/";
  const isBillingUI = path.startsWith("/billing");
  const isAPI = path.startsWith("/api/");
  const isBillingAPI = path.startsWith("/api/billing");

  const isPublicPage = isRoot || isAuthRoute;

  // IMPORTANT: avoid infinite loop when we call /api/billing from inside middleware.
  if (isBillingAPI) {
    return NextResponse.next();
  }

  // =====================================================
  // 1) LOGGED-OUT USERS
  // =====================================================
  if (!userId) {
    // a) allow landing + login/signup
    if (isPublicPage) return NextResponse.next();

    // b) ALL api routes → 401 JSON (including /api/billing)
    if (isAPI) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // c) everything else → /login
    const login = url.clone();
    login.pathname = "/login";
    login.search = "";
    return NextResponse.redirect(login);
  }

  // =====================================================
  // 2) LOGGED-IN USERS → CHECK SUBSCRIPTION
  // =====================================================
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

  // =====================================================
  // 2A) LOGGED IN BUT NOT SUBSCRIBED
  // =====================================================
  if (!subscribed) {
    // allow billing UI + billing API
    if (isBillingUI || isBillingAPI) return NextResponse.next();

    // allow landing + auth pages (NO redirect loop)
    if (isPublicPage) return NextResponse.next();

    // allow other public APIs if you want; right now block all
    if (isAPI) {
      return NextResponse.json({ error: "Payment required" }, { status: 402 });
    }

    // everything else → billing
    const bill = url.clone();
    bill.pathname = "/billing";
    bill.search = "";
    return NextResponse.redirect(bill);
  }

  // =====================================================
  // 2B) LOGGED IN + SUBSCRIBED
  // =====================================================
  // never show landing or auth once subscribed
  if (isPublicPage) {
    const dash = url.clone();
    dash.pathname = "/dashboard";
    dash.search = "";
    return NextResponse.redirect(dash);
  }

  // all other routes allowed
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api)(.*)"],
};
