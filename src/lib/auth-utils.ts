import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { SessionUser } from "@/types";

export async function getSessionUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user as SessionUser;
}

export async function requireRole(role: "PROVIDER" | "WORKER"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user.role) {
    redirect("/onboarding");
  }
  if (user.role !== role) {
    redirect(user.role === "PROVIDER" ? "/agency/dashboard" : "/worker/shifts");
  }
  return user;
}

export async function requireProvider(): Promise<SessionUser> {
  return requireRole("PROVIDER");
}

export async function requireWorker(): Promise<SessionUser> {
  return requireRole("WORKER");
}

// Admin check — uses ADMIN_EMAILS env var (comma-separated)
// Replace with a proper admin role field when scaling
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    const dest = user.role === "PROVIDER" ? "/agency/dashboard" : user.role === "WORKER" ? "/worker/shifts" : "/onboarding";
    redirect(dest);
  }
  return user;
}
