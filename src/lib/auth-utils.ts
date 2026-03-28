import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { SessionUser } from "@/types";

// Retrieves the authenticated user from the session, redirecting to login if not found
export async function getSessionUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user as SessionUser;
}

// Ensures the authenticated user has a specific role, redirecting if not
export async function requireRole(role: "PROVIDER" | "WORKER"): Promise<SessionUser> {
  const user = await getSessionUser();
  // No role assigned yet — send to onboarding to pick one
  if (!user.role) {
    redirect("/onboarding");
  }
  // Wrong role — redirect to the correct dashboard for their actual role
  if (user.role !== role) {
    redirect(user.role === "PROVIDER" ? "/agency/dashboard" : "/worker/shifts");
  }
  return user;
}

// Convenience wrapper requiring PROVIDER role
export async function requireProvider(): Promise<SessionUser> {
  return requireRole("PROVIDER");
}

// Convenience wrapper requiring WORKER role
export async function requireWorker(): Promise<SessionUser> {
  return requireRole("WORKER");
}

// Admin check — uses ADMIN_EMAILS env var (comma-separated list)
// This is a simple approach for MVP; replace with a proper admin role DB field when scaling
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

// Ensures the authenticated user is an admin (by email whitelist), redirecting if not
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    // Non-admin users get redirected to their appropriate dashboard
    const dest = user.role === "PROVIDER" ? "/agency/dashboard" : user.role === "WORKER" ? "/worker/shifts" : "/onboarding";
    redirect(dest);
  }
  return user;
}
