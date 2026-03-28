import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user as { role?: string; onboardingCompleted?: boolean } | undefined;

  // Let public routes through
  const publicPaths = ["/", "/pricing", "/for-workers", "/for-families", "/resources", "/demo", "/forgot-password", "/reset-password", "/terms", "/privacy", "/api/auth", "/api/webhooks", "/how-it-works"];
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Auth pages — redirect logged-in users to their dashboard
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

  // Not logged in on a protected route — redirect to login with context
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

  // Onboarding not completed — redirect to onboarding
  if (user && !user.onboardingCompleted && pathname !== "/onboarding") {
    return NextResponse.redirect(new URL("/onboarding", req.nextUrl));
  }

  // Role-based route protection
  const role = user?.role;
  if (role) {
    // Workers can't access /agency/* or /provider/*
    if (role === "WORKER" && (pathname.startsWith("/agency") || pathname.startsWith("/provider"))) {
      return NextResponse.redirect(new URL("/worker/shifts", req.nextUrl));
    }
    // Providers can't access /worker/*
    if (role === "PROVIDER" && pathname.startsWith("/worker")) {
      return NextResponse.redirect(new URL("/agency/dashboard", req.nextUrl));
    }
    // Redirect old /provider/* routes to /agency/*
    if (role === "PROVIDER" && pathname.startsWith("/provider")) {
      const newPath = pathname.replace("/provider", "/agency");
      return NextResponse.redirect(new URL(newPath, req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)"],
};
