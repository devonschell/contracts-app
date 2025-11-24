// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublic = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/favicon.ico",
  "/api/health",
  "/api/cron/(.*)",
  "/api/webhooks/(.*)",
  "/api/stripe/webhook",
]);

export default clerkMiddleware((auth, req) => {
  const path = req.nextUrl.pathname;
  const { userId } = auth();

  const attach = (res: NextResponse) => {
    res.headers.set("x-next-pathname", path);
    return res;
  };

  if (isPublic(req)) return attach(NextResponse.next());

  if (!userId) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect_url", req.url);
    return attach(NextResponse.redirect(loginUrl));
  }

  if (path === "/") {
    return attach(NextResponse.redirect(new URL("/dashboard", req.url)));
  }

  return attach(NextResponse.next());
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api)(.*)"],
};
