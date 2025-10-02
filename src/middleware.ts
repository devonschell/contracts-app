// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Only these are public. EVERYTHING else requires sign-in.
const isPublic = createRouteMatcher([
  "/login(.*)",
  "/signup(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/favicon.ico",

  // Public APIs that you secure internally
  "/api/cron/(.*)",     // guarded by CRON_SECRET inside the handler
  "/api/webhooks/(.*)", // e.g., Stripe webhooks
  "/api/health",
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes straight through
  if (isPublic(req)) return;

  // For everything else, require a user
  const { userId } = await auth();
  if (!userId) {
    // APIs get 401 JSON
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    // Pages get redirected to your sign-in page (change to "/sign-in" if that's your route)
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect_url", req.url); // optional: send back after login
    return NextResponse.redirect(url);
  }
});

export const config = {
  // Run on all routes except Next internals & static files; includes /api
  matcher: ["/((?!_next|.*\\..*).*)", "/(api)(.*)"],
};
