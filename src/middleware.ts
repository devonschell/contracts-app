import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = req.nextUrl;
  const path = url.pathname;

  // Pass pathname to layout
  const withPath = (res: NextResponse) => {
    res.headers.set("x-next-pathname", path);
    return res;
  };

  //
  // 1. PUBLIC ROUTES
  //
  if (isPublic(req)) return withPath(NextResponse.next());

  //
  // 2. REQUIRE AUTH
  //
  if (!userId) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect_url", req.url);
    return withPath(NextResponse.redirect(loginUrl));
  }

  //
  // 3. SPECIAL HANDLING FOR "/"
  //    (Clerk hydration touches "/", allow it)
  //
  if (path === "/") {
    return withPath(NextResponse.redirect(new URL("/dashboard", req.url)));
  }

  //
  // 4. ALLOW EVERYTHING ELSE
  //
  return withPath(NextResponse.next());
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api)(.*)"],
};
