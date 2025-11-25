// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes (no auth required)
const isPublic = createRouteMatcher([
  // NOTE: deliberately **not** including "/" here
  "/login(.*)",
  "/signup(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/oauth-callback(.*)",
  "/auth-callback(.*)",
  "/favicon.ico",
  "/api/health",
  "/api/cron/(.*)",
  "/api/webhooks/(.*)",
  "/api/stripe/webhook",
]);

export default clerkMiddleware((auth, req) => {
  const { userId } = auth();
  const url = req.nextUrl;
  const path = url.pathname;

  // helper to keep x-next-pathname for the app layout
  const withPath = (res: NextResponse) => {
    res.headers.set("x-next-pathname", path);
    return res;
  };

  // 1) Public routes always allowed
  if (isPublic(req)) {
    return withPath(NextResponse.next());
  }

  // 2) Landing page "/" is public **only when logged out**
  if (!userId && path === "/") {
    return withPath(NextResponse.next());
  }

  // 3) Everything else requires auth
  if (!userId) {
    // API: return 401 instead of redirecting to HTML login
    if (path.startsWith("/api/")) {
      return withPath(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect_url", req.url);
    return withPath(NextResponse.redirect(loginUrl));
  }

  // 4) If logged in and hit "/", send to dashboard
  if (path === "/") {
    return withPath(NextResponse.redirect(new URL("/dashboard", req.url)));
  }

  // 5) Default: allow
  return withPath(NextResponse.next());
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api)(.*)"],
};
