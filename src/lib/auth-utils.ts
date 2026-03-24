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
  if (user.role !== role) {
    redirect(user.role === "PROVIDER" ? "/provider/dashboard" : "/worker/shifts");
  }
  return user;
}

export async function requireProvider(): Promise<SessionUser> {
  return requireRole("PROVIDER");
}

export async function requireWorker(): Promise<SessionUser> {
  return requireRole("WORKER");
}
