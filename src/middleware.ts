import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Middleware runs on every matched request — handles auth, role routing, and onboarding enforcement
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user as { role?: string; onboardingCompleted?: boolean } | undefined;

  // Public routes that don't require authentication
  // BUG FIX: Added /api/cron to match config.ts authorized callback — cron endpoints were being blocked
  const publicPaths = ["/", "/pricing", "/for-workers", "/for-families", "/resources", "/demo", "/forgot-password", "/reset-password", "/terms", "/privacy", "/api/auth", "/api/webhooks", "/api/cron", "/how-it-works"];
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Auth pages — redirect already-authenticated users to their dashboard
  // Prevents logged-in users from seeing login/signup pages
  if (pathname === "/login" || pathname === "/signup") {
    if (user && user.onboardingCompleted) {
      const dest = user.role === "PROVIDER" ? "/agency/dashboard" : "/worker/shifts";
      return NextResponse.redirect(new URL(dest, req.nextUrl));
    }
    return NextResponse.next();
  }

  // Known protected route prefixes — only these require auth
  const protectedPrefixes = ["/worker", "/agency", "/admin", "/provider", "/onboarding"];
  const isProtectedRoute = protectedPrefixes.some((p) => pathname.startsWith(p));

  // Unauthenticated user on a protected route — redirect to login with return URL
  if (!user && isProtectedRoute) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("redirect", pathname);
    loginUrl.searchParams.set("reason", "auth");
    return NextResponse.redirect(loginUrl);
  }

  // Unknown routes (not public, not protected) — let Next.js handle (shows 404)
  if (!user && !isProtectedRoute) {
    return NextResponse.next();
  }

  // Onboarding gate — force users who haven't completed onboarding to the onboarding page
  // Exception: the onboarding page itself to avoid redirect loops
  if (user && !user.onboardingCompleted && pathname !== "/onboarding") {
    return NextResponse.redirect(new URL("/onboarding", req.nextUrl));
  }

  // Role-based route protection — prevent cross-role access
  const role = user?.role;
  if (role) {
    // Workers cannot access agency or legacy provider routes
    if (role === "WORKER" && (pathname.startsWith("/agency") || pathname.startsWith("/provider"))) {
      return NextResponse.redirect(new URL("/worker/shifts", req.nextUrl));
    }
    // Providers cannot access worker routes
    if (role === "PROVIDER" && pathname.startsWith("/worker")) {
      return NextResponse.redirect(new URL("/agency/dashboard", req.nextUrl));
    }
    // Redirect legacy /provider/* routes to /agency/* for provider users
    if (role === "PROVIDER" && pathname.startsWith("/provider")) {
      const newPath = pathname.replace("/provider", "/agency");
      return NextResponse.redirect(new URL(newPath, req.nextUrl));
    }
  }

  return NextResponse.next();
});

// Matcher config — skip static assets and metadata files
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)"],
};
