// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes (no auth)
const isPublic = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/favicon.ico",

  // Public APIs guarded internally
  "/api/cron/(.*)",
  "/api/webhooks/(.*)",
  "/api/health",
]);

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;

  // If you're already signed in and you hit the landing page, send to dashboard
  const { userId } = await auth();
  if (userId && url.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Let public routes straight through
  if (isPublic(req)) return;

  // Server-to-server bypass for cron/ops when CRON_SECRET matches
  const cronSecret = process.env.CRON_SECRET || "";
  const provided =
    (req.headers.get("x-cron-secret") || url.searchParams.get("key") || "").trim();

  const hasBypass =
    Boolean(cronSecret) &&
    provided.length > 0 &&
    provided === cronSecret &&
    (
      url.pathname.startsWith("/api/cron/") ||
      url.pathname.startsWith("/api/contracts")
    );

  if (hasBypass) return;

  // Everything else requires a signed-in user
  if (!userId) {
    // APIs get 401 JSON
    if (url.pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    // Pages get redirected to sign-in, preserving destination
    const signInUrl = new URL("/login", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  // Run on all routes except Next internals & static files; includes /api
  matcher: ["/((?!_next|.*\\..*).*)", "/(api)(.*)"],
};
