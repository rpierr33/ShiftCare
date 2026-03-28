"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ActionResult } from "@/types";

/**
 * Register a new user account with email/password.
 * Creates role-specific profile (WorkerProfile or ProviderProfile + Subscription).
 * Auto-signs in after successful registration.
 */
export async function signUpAction(formData: FormData): Promise<ActionResult<{ role: string }>> {
  // Extract and sanitize form inputs
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const name = (formData.get("name") as string)?.trim();
  const role = formData.get("role") as "PROVIDER" | "WORKER";
  const providerType = (formData.get("providerType") as "AGENCY" | "PRIVATE") || "AGENCY";

  // Validate all required fields are present
  if (!email || !password || !name || !role) {
    return { success: false, error: "All fields are required." };
  }
  // Validate role is one of the allowed values
  if (!["PROVIDER", "WORKER"].includes(role)) {
    return { success: false, error: "Invalid role." };
  }
  // Enforce minimum password length
  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  // Rate-limit signup attempts per email to prevent abuse
  const rateCheck = await checkRateLimit(`signup:${email}`, {
    windowMs: 15 * 60 * 1000, // 15-minute window
    maxAttempts: 5,
  });
  if (!rateCheck.allowed) {
    return { success: false, error: `Too many attempts. Try again in ${rateCheck.retryAfter}s.` };
  }

  // Check for existing account with this email
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  // Hash password with bcrypt (cost factor 12)
  const passwordHash = await bcrypt.hash(password, 12);

  // Create the user record
  const user = await db.user.create({
    data: {
      email,
      name,
      passwordHash,
      role,
    },
  });

  // Create role-specific profile based on selected role
  if (role === "WORKER") {
    // Workers get a bare profile to be completed during onboarding
    await db.workerProfile.create({
      data: { userId: user.id },
    });
  } else {
    // Providers get a profile + subscription record
    const plan = (formData.get("plan") as string)?.toUpperCase();
    // Validate plan selection, default to FREE if invalid
    const validPlan = ["STARTER", "PROFESSIONAL"].includes(plan) ? plan as "STARTER" | "PROFESSIONAL" : "FREE" as const;

    const profile = await db.providerProfile.create({
      data: {
        userId: user.id,
        companyName: name,
        providerType: providerType === "PRIVATE" ? "PRIVATE" : "AGENCY",
        subscriptionPlan: validPlan,
      },
    });
    // Create subscription record linked to provider profile
    await db.subscription.create({
      data: {
        providerProfileId: profile.id,
        plan: validPlan,
        status: "ACTIVE", // Stripe webhook will confirm paid plans in production
      },
    });
  }

  // Auto sign in after successful signup
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    // NextAuth may throw NEXT_REDIRECT on success -- that's expected behavior
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("NEXT_REDIRECT")) {
      console.error("Auto sign-in after signup failed:", error);
    }
  }

  return { success: true, data: { role } };
}

/**
 * Authenticate user with email/password credentials.
 * Validates credentials manually before delegating to NextAuth signIn.
 */
export async function signInAction(formData: FormData): Promise<ActionResult<{ role: string | null }>> {
  // Extract and sanitize form inputs
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  // Validate required fields
  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  // Rate-limit login attempts per email to prevent brute-force
  const rateCheck = await checkRateLimit(`login:${email}`, {
    windowMs: 15 * 60 * 1000, // 15-minute window
    maxAttempts: 10,
  });
  if (!rateCheck.allowed) {
    return { success: false, error: `Too many login attempts. Try again in ${rateCheck.retryAfter}s.` };
  }

  // Manually verify credentials before calling NextAuth
  const user = await db.user.findUnique({ where: { email } });
  // Block inactive accounts with generic error to avoid user enumeration
  if (!user || !user.isActive) {
    return { success: false, error: "Invalid email or password." };
  }
  // Redirect Google OAuth users to the correct auth flow
  if (!user.passwordHash) {
    return { success: false, error: "This account uses Google sign-in. Please use the Google button." };
  }
  // Compare submitted password against stored hash
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { success: false, error: "Invalid email or password." };
  }

  // Delegate to NextAuth for session creation
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    // NEXT_REDIRECT means NextAuth is trying to redirect -- sign-in succeeded
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

/**
 * Sign out the current user and destroy the session.
 */
export async function signOutAction(): Promise<void> {
  await signOut({ redirect: false });
}

/**
 * Request a password reset email for the given email address.
 * Always returns success to avoid revealing whether the email exists.
 */
export async function requestPasswordReset(email: string): Promise<ActionResult> {
  try {
    const trimmed = email.trim().toLowerCase();
    // Empty email still returns success to avoid revealing account existence
    if (!trimmed) {
      return { success: true };
    }

    // Look up user but never reveal whether they exist
    const user = await db.user.findUnique({ where: { email: trimmed } });
    if (!user || !user.isActive) {
      return { success: true };
    }

    // Delete any existing reset tokens for this email to prevent stale tokens
    await db.passwordResetToken.deleteMany({ where: { email: trimmed } });

    // Generate a cryptographically random token
    const { nanoid } = await import("nanoid");
    const token = nanoid(48);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Store the token in the database
    await db.passwordResetToken.create({
      data: { email: trimmed, token, expiresAt },
    });

    // Send email via Resend if API key is configured
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
            <p style="color: #9ca3af; font-size: 12px;">ShiftCare -- Healthcare Staffing Platform</p>
          </div>`,
        });
      } catch (e) {
        console.error("Password reset email failed:", e);
      }
    } else {
      // Log token for development use only
      console.log(`[DEV] Password reset token for ${trimmed}: ${token}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Password reset request failed:", error);
    // Always return success to avoid information leakage
    return { success: true };
  }
}

/**
 * Reset password using a valid reset token.
 * Validates token expiry, hashes new password, and deletes the used token atomically.
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ActionResult> {
  try {
    // Validate inputs
    if (!token || !newPassword) {
      return { success: false, error: "Token and password are required." };
    }

    // Enforce minimum password length
    if (newPassword.length < 8) {
      return { success: false, error: "Password must be at least 8 characters." };
    }

    // Look up the reset token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return { success: false, error: "Invalid or expired reset link. Please request a new one." };
    }

    // Check token expiry and clean up if expired
    if (resetToken.expiresAt < new Date()) {
      await db.passwordResetToken.delete({ where: { id: resetToken.id } });
      return { success: false, error: "This reset link has expired. Please request a new one." };
    }

    // Verify the associated user exists and is active
    const user = await db.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user || !user.isActive) {
      return { success: false, error: "Account not found." };
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Atomically update password and delete the used token
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
