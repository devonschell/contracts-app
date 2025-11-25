// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes — no auth required
const isPublic = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/oauth-callback(.*)",
  "/auth-callback(.*)",
  "/favicon.ico",
  "/api/health",
  "/api/webhooks/(.*)",
  "/api/stripe/webhook",
]);

export default clerkMiddleware((auth, req) => {
  const { userId } = auth();
  const path = req.nextUrl.pathname;

  // 1) Always allow public routes (including "/")
  if (isPublic(req)) {
    return NextResponse.next();
  }

  // 2) Everything else requires auth
  if (!userId) {
    if (path.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 3) Authenticated → allow through
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api)(.*)"],
};
