// middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware((auth, req) => {
  const { userId, sessionId, redirectToSignIn } = auth();
  const path = req.nextUrl.pathname;

  // Public routes (no auth required)
  const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/sign-in",
    "/sign-up",
    "/favicon.ico",
  ];

  const isPublic = publicRoutes.some((r) => path === r || path.startsWith(r));

  // Allow public routes
  if (isPublic) {
    return NextResponse.next();
  }

  // Protected API routes must return 401 instead of redirect
  if (!userId && path.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Protected UI routes redirect to /login
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  return NextResponse.next();
});

// VERY IMPORTANT NEXT CONFIG
export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api)(.*)",
  ],
};
