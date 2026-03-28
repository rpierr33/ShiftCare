"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { signOut } from "@/auth";
import type { ActionResult } from "@/types";

export async function updateEmail(
  newEmail: string,
  currentPassword: string
): Promise<ActionResult> {
  try {
    const sessionUser = await getSessionUser();
    const user = await db.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) return { success: false, error: "User not found." };

    if (!user.passwordHash) return { success: false, error: "This account uses Google sign-in." };
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return { success: false, error: "Current password is incorrect." };

    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      return { success: false, error: "Invalid email address." };
    }

    const existing = await db.user.findUnique({ where: { email: trimmed } });
    if (existing && existing.id !== user.id) {
      return { success: false, error: "This email is already in use." };
    }

    await db.user.update({
      where: { id: user.id },
      data: { email: trimmed },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update email:", error);
    return { success: false, error: "Failed to update email." };
  }
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string
): Promise<ActionResult> {
  try {
    const sessionUser = await getSessionUser();
    const user = await db.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) return { success: false, error: "User not found." };

    if (!user.passwordHash) return { success: false, error: "This account uses Google sign-in." };
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return { success: false, error: "Current password is incorrect." };

    if (newPassword.length < 8) {
      return { success: false, error: "New password must be at least 8 characters." };
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update password:", error);
    return { success: false, error: "Failed to update password." };
  }
}

export async function updateNotificationPrefs(
  prefs: Record<string, boolean>
): Promise<ActionResult> {
  try {
    const sessionUser = await getSessionUser();

    if (sessionUser.role === "WORKER") {
      // Preserve existing frequency setting when updating toggle prefs
      const profile = await db.workerProfile.findUnique({
        where: { userId: sessionUser.id },
        select: { notificationPrefs: true },
      });
      const existingPrefs = (profile?.notificationPrefs as Record<string, unknown>) || {};
      const merged = { ...existingPrefs, ...prefs } as Record<string, string | boolean>;
      await db.workerProfile.update({
        where: { userId: sessionUser.id },
        data: { notificationPrefs: merged },
      });
    } else {
      const profile = await db.providerProfile.findUnique({
        where: { userId: sessionUser.id },
        select: { notificationPrefs: true },
      });
      const existingPrefs = (profile?.notificationPrefs as Record<string, unknown>) || {};
      const merged = { ...existingPrefs, ...prefs } as Record<string, string | boolean>;
      await db.providerProfile.update({
        where: { userId: sessionUser.id },
        data: { notificationPrefs: merged },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to update notification prefs:", error);
    return { success: false, error: "Failed to update preferences." };
  }
}

const VALID_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
];

export async function updateTimezone(timezone: string): Promise<ActionResult> {
  try {
    if (!VALID_TIMEZONES.includes(timezone)) {
      return { success: false, error: "Invalid timezone." };
    }
    const sessionUser = await getSessionUser();
    await db.user.update({
      where: { id: sessionUser.id },
      data: { timezone },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to update timezone:", error);
    return { success: false, error: "Failed to update timezone." };
  }
}

export async function getUserTimezone(): Promise<string | null> {
  try {
    const sessionUser = await getSessionUser();
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: { timezone: true },
    });
    return user?.timezone ?? null;
  } catch {
    return null;
  }
}

const VALID_FREQUENCIES = ["realtime", "daily_digest", "urgent_only"];

export async function updateNotificationFrequency(
  frequency: string
): Promise<ActionResult> {
  try {
    if (!VALID_FREQUENCIES.includes(frequency)) {
      return { success: false, error: "Invalid notification frequency." };
    }

    const sessionUser = await getSessionUser();

    if (sessionUser.role === "WORKER") {
      const profile = await db.workerProfile.findUnique({
        where: { userId: sessionUser.id },
        select: { notificationPrefs: true },
      });
      const existingPrefs = (profile?.notificationPrefs as Record<string, unknown>) || {};
      await db.workerProfile.update({
        where: { userId: sessionUser.id },
        data: { notificationPrefs: { ...existingPrefs, frequency } as Record<string, string | boolean> },
      });
    } else {
      const profile = await db.providerProfile.findUnique({
        where: { userId: sessionUser.id },
        select: { notificationPrefs: true },
      });
      const existingPrefs = (profile?.notificationPrefs as Record<string, unknown>) || {};
      await db.providerProfile.update({
        where: { userId: sessionUser.id },
        data: { notificationPrefs: { ...existingPrefs, frequency } as Record<string, string | boolean> },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to update notification frequency:", error);
    return { success: false, error: "Failed to update notification frequency." };
  }
}

export async function getNotificationFrequency(): Promise<string> {
  try {
    const sessionUser = await getSessionUser();

    if (sessionUser.role === "WORKER") {
      const profile = await db.workerProfile.findUnique({
        where: { userId: sessionUser.id },
        select: { notificationPrefs: true },
      });
      const prefs = (profile?.notificationPrefs as Record<string, unknown>) || {};
      return (prefs.frequency as string) || "realtime";
    } else {
      const profile = await db.providerProfile.findUnique({
        where: { userId: sessionUser.id },
        select: { notificationPrefs: true },
      });
      const prefs = (profile?.notificationPrefs as Record<string, unknown>) || {};
      return (prefs.frequency as string) || "realtime";
    }
  } catch {
    return "realtime";
  }
}

export async function deleteAccount(
  confirmation: string
): Promise<ActionResult> {
  try {
    if (confirmation !== "DELETE") {
      return { success: false, error: "Please type DELETE to confirm." };
    }

    const sessionUser = await getSessionUser();
    await db.user.update({
      where: { id: sessionUser.id },
      data: { isActive: false },
    });

    await signOut({ redirect: false });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    // NextAuth may throw NEXT_REDIRECT on signOut — that's OK
    if (message.includes("NEXT_REDIRECT")) {
      return { success: true };
    }
    console.error("Failed to delete account:", error);
    return { success: false, error: "Failed to delete account." };
  }
}
