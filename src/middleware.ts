import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId } = auth();
  const url = req.nextUrl;
  const path = url.pathname;

  const AUTH_ROUTES = ["/login", "/signup", "/sign-in", "/sign-up"];
  const isAuthRoute = AUTH_ROUTES.includes(path);
  const isRoot = path === "/";
  const isBilling = path.startsWith("/billing");
  const isBillingAPI = path.startsWith("/api/billing");

  const isStatic =
    path.startsWith("/_next") ||
    path.startsWith("/favicon.ico") ||
    path.match(/\.[a-zA-Z0-9]+$/);

  if (isStatic) return NextResponse.next();

  // ----------------------------
  // LOGGED OUT USERS
  // ----------------------------
  if (!userId) {
    // allow landing & auth pages
    if (isRoot || isAuthRoute) return NextResponse.next();

    // everything else → login
    const login = url.clone();
    login.pathname = "/login";
    login.search = "";
    return NextResponse.redirect(login);
  }

  // ----------------------------
  // LOGGED IN USERS → check subscription
  // ----------------------------
  let subscribed = false;
  try {
    const res = await fetch(`${url.origin}/api/billing`, {
      method: "GET",
      headers: { Cookie: req.headers.get("cookie") || "" },
    });
    const data = await res.json();
    subscribed = !!data.subscribed;
  } catch {}

  // ----------------------------
  // LOGGED IN BUT NOT SUBSCRIBED
  // ----------------------------
  if (!subscribed) {
    // allow billing UI & API
    if (isBilling || isBillingAPI) return NextResponse.next();

    // allow landing page
    if (isRoot) return NextResponse.next();

    // allow login/signup (NO REDIRECT here)
    if (isAuthRoute) return NextResponse.next();

    // everything else goes to billing
    const bill = url.clone();
    bill.pathname = "/billing";
    return NextResponse.redirect(bill);
  }

  // ----------------------------
  // LOGGED IN + SUBSCRIBED
  // ----------------------------
  // never show landing or auth again
  if (isRoot || isAuthRoute) {
    const dash = url.clone();
    dash.pathname = "/dashboard";
    return NextResponse.redirect(dash);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api)(.*)"],
};
