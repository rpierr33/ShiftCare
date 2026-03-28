"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ActionResult } from "@/types";

export async function signUpAction(formData: FormData): Promise<ActionResult<{ role: string }>> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const name = (formData.get("name") as string)?.trim();
  const role = formData.get("role") as "PROVIDER" | "WORKER";
  const providerType = (formData.get("providerType") as "AGENCY" | "PRIVATE") || "AGENCY";

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
    const plan = (formData.get("plan") as string)?.toUpperCase();
    const validPlan = ["STARTER", "PROFESSIONAL"].includes(plan) ? plan as "STARTER" | "PROFESSIONAL" : "FREE" as const;

    const profile = await db.providerProfile.create({
      data: {
        userId: user.id,
        companyName: name,
        providerType: providerType === "PRIVATE" ? "PRIVATE" : "AGENCY",
        subscriptionPlan: validPlan,
      },
    });
    await db.subscription.create({
      data: {
        providerProfileId: profile.id,
        plan: validPlan,
        status: validPlan === "FREE" ? "ACTIVE" : "ACTIVE", // Stripe webhook will confirm paid plans
      },
    });
  }

  // Auto sign in after signup
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    // NextAuth may throw NEXT_REDIRECT on success — that's OK
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("NEXT_REDIRECT")) {
      console.error("Auto sign-in after signup failed:", error);
    }
  }

  return { success: true, data: { role } };
}

export async function signInAction(formData: FormData): Promise<ActionResult<{ role: string | null }>> {
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

  // First verify credentials manually
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return { success: false, error: "Invalid email or password." };
  }
  if (!user.passwordHash) {
    return { success: false, error: "This account uses Google sign-in. Please use the Google button." };
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { success: false, error: "Invalid email or password." };
  }

  // Now sign in — NextAuth may throw NEXT_REDIRECT which is actually success
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    // NEXT_REDIRECT means NextAuth is trying to redirect — sign-in succeeded
    if (!message.includes("NEXT_REDIRECT")) {
      return { success: false, error: "Sign in failed. Please try again." };
    }
  }

  return {
    success: true,
    data: {
      role: user.role ?? null,
    },
  };
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirect: false });
}

export async function requestPasswordReset(email: string): Promise<ActionResult> {
  try {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      return { success: true }; // Don't reveal if email exists
    }

    const user = await db.user.findUnique({ where: { email: trimmed } });
    if (!user || !user.isActive) {
      // Don't reveal whether the email exists — always return success
      return { success: true };
    }

    // Delete any existing tokens for this email
    await db.passwordResetToken.deleteMany({ where: { email: trimmed } });

    // Generate token
    const { nanoid } = await import("nanoid");
    const token = nanoid(48);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.passwordResetToken.create({
      data: { email: trimmed, token, expiresAt },
    });

    // Send email via Resend if configured
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const resetUrl = `${baseUrl}/reset-password?token=${token}`;

        await resend.emails.send({
          from: "ShiftCare <no-reply@shiftcare.com>",
          to: trimmed,
          subject: "Reset Your ShiftCare Password",
          html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0891b2;">Reset Your Password</h2>
            <p>You requested a password reset. Click the link below to set a new password:</p>
            <p><a href="${resetUrl}" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a></p>
            <p style="color: #6b7280; font-size: 14px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">ShiftCare — Healthcare Staffing Platform</p>
          </div>`,
        });
      } catch (e) {
        console.error("Password reset email failed:", e);
      }
    } else {
      // Log token for development
      console.log(`[DEV] Password reset token for ${trimmed}: ${token}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Password reset request failed:", error);
    return { success: true }; // Don't reveal errors to client
  }
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ActionResult> {
  try {
    if (!token || !newPassword) {
      return { success: false, error: "Token and password are required." };
    }

    if (newPassword.length < 8) {
      return { success: false, error: "Password must be at least 8 characters." };
    }

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return { success: false, error: "Invalid or expired reset link. Please request a new one." };
    }

    if (resetToken.expiresAt < new Date()) {
      await db.passwordResetToken.delete({ where: { id: resetToken.id } });
      return { success: false, error: "This reset link has expired. Please request a new one." };
    }

    const user = await db.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user || !user.isActive) {
      return { success: false, error: "Account not found." };
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      db.passwordResetToken.delete({
        where: { id: resetToken.id },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Password reset failed:", error);
    return { success: false, error: "Failed to reset password. Please try again." };
  }
}
