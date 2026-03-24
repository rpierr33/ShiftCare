import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user as { role?: string; onboardingCompleted?: boolean } | undefined;

  // Let public routes through
  const publicPaths = ["/", "/login", "/signup", "/pricing", "/api/auth"];
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Not logged in — redirect to login
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Onboarding not completed — redirect to onboarding
  if (!user.onboardingCompleted && pathname !== "/onboarding") {
    return NextResponse.redirect(new URL("/onboarding", req.nextUrl));
  }

  // Role-based route protection
  const role = user.role;
  if (role) {
    // Workers can't access /provider/*
    if (role === "WORKER" && pathname.startsWith("/provider")) {
      return NextResponse.redirect(new URL("/worker/shifts", req.nextUrl));
    }
    // Providers can't access /worker/*
    if (role === "PROVIDER" && pathname.startsWith("/worker")) {
      return NextResponse.redirect(new URL("/provider/dashboard", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)"],
};
