"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ActionResult } from "@/types";

export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const name = (formData.get("name") as string)?.trim();
  const role = formData.get("role") as "PROVIDER" | "WORKER";

  if (!email || !password || !name || !role) {
    return { success: false, error: "All fields are required." };
  }
  if (!["PROVIDER", "WORKER"].includes(role)) {
    return { success: false, error: "Invalid role." };
  }
  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  const rateCheck = await checkRateLimit(`signup:${email}`, {
    windowMs: 15 * 60 * 1000,
    maxAttempts: 5,
  });
  if (!rateCheck.allowed) {
    return { success: false, error: `Too many attempts. Try again in ${rateCheck.retryAfter}s.` };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      email,
      name,
      passwordHash,
      role,
    },
  });

  // Create profile based on role
  if (role === "WORKER") {
    await db.workerProfile.create({
      data: { userId: user.id },
    });
  } else {
    const profile = await db.providerProfile.create({
      data: {
        userId: user.id,
        companyName: name,
      },
    });
    await db.subscription.create({
      data: {
        providerProfileId: profile.id,
        plan: "FREE",
        status: "ACTIVE",
      },
    });
  }

  // Auto sign in
  await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  return { success: true };
}

export async function signInAction(formData: FormData): Promise<ActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  const rateCheck = await checkRateLimit(`login:${email}`, {
    windowMs: 15 * 60 * 1000,
    maxAttempts: 10,
  });
  if (!rateCheck.allowed) {
    return { success: false, error: `Too many login attempts. Try again in ${rateCheck.retryAfter}s.` };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { success: true };
  } catch {
    return { success: false, error: "Invalid email or password." };
  }
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirect: false });
}
