import { clerkMiddleware } from "@clerk/nextjs/server";
export default clerkMiddleware({
  publicRoutes: ["/", "/login(.*)", "/signup(.*)", "/favicon.ico"],
});
export const config = {
  // run on everything except Next assets & static files — and include /api
  matcher: ["/((?!_next|.*\\..*).*)", "/(api)(.*)"],
};
