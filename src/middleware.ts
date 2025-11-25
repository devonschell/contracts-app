import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes — Clerk MUST be allowed to load these
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

  // Always allow Clerk’s public routes + landing page
  if (isPublic(req)) return NextResponse.next();

  // Require auth for everything else
  if (!userId) {
    const login = new URL("/login", req.url);
    login.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api)(.*)"],
};
