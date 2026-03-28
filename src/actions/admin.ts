"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { sendNotification } from "@/lib/notifications";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import { getRequiredCredentials } from "@/lib/credential-requirements";

// Approve individual credential item
export async function approveCredentialItem(
  credentialId: string,
  expiryDate?: string
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const credential = await db.credential.findUnique({
      where: { id: credentialId },
      include: { workerProfile: { include: { user: true } } },
    });

    if (!credential) {
      return { success: false, error: "Credential not found." };
    }

    const updateData: Record<string, unknown> = {
      status: "VERIFIED",
      verifiedAt: new Date(),
    };

    if (expiryDate) {
      const expiry = new Date(expiryDate);
      if (isNaN(expiry.getTime())) {
        return { success: false, error: "Invalid expiry date." };
      }
      updateData.expiryDate = expiry;
    }

    await db.credential.update({
      where: { id: credentialId },
      data: updateData,
    });

    // Check if worker is now fully verified
    await checkWorkerFullyVerified(credential.workerProfileId);

    revalidatePath("/admin/credentials");
    return { success: true };
  } catch (error) {
    console.error("Failed to approve credential item:", error);
    return { success: false, error: "Failed to approve credential." };
  }
}

// Reject individual credential item
export async function rejectCredentialItem(
  credentialId: string,
  reason: string
): Promise<ActionResult> {
  try {
    await requireAdmin();

    if (!reason.trim()) {
      return { success: false, error: "Rejection reason is required." };
    }

    const credential = await db.credential.findUnique({
      where: { id: credentialId },
      include: { workerProfile: { include: { user: true } } },
    });

    if (!credential) {
      return { success: false, error: "Credential not found." };
    }

    await db.credential.update({
      where: { id: credentialId },
      data: {
        status: "REJECTED",
        notes: reason.trim(),
      },
    });

    // Worker can't be fully verified if any credential is rejected
    await db.workerProfile.update({
      where: { id: credential.workerProfileId },
      data: {
        credentialStatus: "PENDING",
        verificationStatus: "pending",
      },
    });

    // Notify worker
    await sendNotification({
      userId: credential.workerProfile.userId,
      type: "CREDENTIAL_REJECTED",
      title: "Credential Needs Attention",
      body: `Your ${credential.name || credential.type} was not approved. Reason: ${reason.trim()}. Please re-submit.`,
      channels: ["inapp", "email"],
    });

    revalidatePath("/admin/credentials");
    return { success: true };
  } catch (error) {
    console.error("Failed to reject credential item:", error);
    return { success: false, error: "Failed to reject credential." };
  }
}

// Check if all required credentials are verified for a worker
export async function checkWorkerFullyVerified(
  workerProfileId: string
): Promise<boolean> {
  const profile = await db.workerProfile.findUnique({
    where: { id: workerProfileId },
    include: {
      credentials: true,
      user: true,
    },
  });

  if (!profile) return false;

  const required = getRequiredCredentials(profile.workerRole);

  // Check if every required credential type has a VERIFIED credential
  const verifiedTypes = profile.credentials
    .filter((c) => c.status === "VERIFIED")
    .map((c) => c.type);

  const allVerified = required.every((reqType) =>
    verifiedTypes.includes(reqType as never)
  );

  if (allVerified) {
    await db.workerProfile.update({
      where: { id: workerProfileId },
      data: {
        credentialStatus: "VERIFIED",
        verificationStatus: "verified",
      },
    });

    // Notify worker they're fully verified
    await sendNotification({
      userId: profile.userId,
      type: "CREDENTIAL_APPROVED",
      title: "Credentials Verified",
      body: "All your credentials have been verified! You can now accept shifts.",
      channels: ["inapp", "email", "sms"],
    });

    return true;
  }

  return false;
}

// Verify provider
export async function verifyProvider(providerId: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    await db.providerProfile.update({
      where: { id: providerId },
      data: { complianceStatus: "COMPLETE" },
    });

    const profile = await db.providerProfile.findUnique({
      where: { id: providerId },
      select: { userId: true },
    });

    if (profile) {
      await sendNotification({
        userId: profile.userId,
        type: "PROVIDER_VERIFIED",
        title: "Account Verified",
        body: "Your provider account has been verified. You can now post shifts without restrictions.",
        channels: ["inapp", "email"],
      });
    }

    revalidatePath("/admin/providers");
    return { success: true };
  } catch (error) {
    console.error("Failed to verify provider:", error);
    return { success: false, error: "Failed to verify provider." };
  }
}

// Block provider
export async function blockProvider(
  providerId: string,
  reason: string
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const profile = await db.providerProfile.findUnique({
      where: { id: providerId },
      select: { userId: true },
    });

    if (!profile) {
      return { success: false, error: "Provider not found." };
    }

    // Deactivate the user account
    await db.user.update({
      where: { id: profile.userId },
      data: { isActive: false },
    });

    await sendNotification({
      userId: profile.userId,
      type: "ACCOUNT_BLOCKED",
      title: "Account Suspended",
      body: `Your account has been suspended. Reason: ${reason}. Contact support for assistance.`,
      channels: ["inapp", "email"],
    });

    revalidatePath("/admin/providers");
    return { success: true };
  } catch (error) {
    console.error("Failed to block provider:", error);
    return { success: false, error: "Failed to block provider." };
  }
}

// Send warning to provider
export async function sendProviderWarning(
  providerId: string,
  message: string
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const profile = await db.providerProfile.findUnique({
      where: { id: providerId },
      select: { userId: true },
    });

    if (!profile) {
      return { success: false, error: "Provider not found." };
    }

    await sendNotification({
      userId: profile.userId,
      type: "VERIFICATION_WARNING",
      title: "Verification Required",
      body: message,
      channels: ["inapp", "email", "sms"],
    });

    revalidatePath("/admin/providers");
    return { success: true };
  } catch (error) {
    console.error("Failed to send warning:", error);
    return { success: false, error: "Failed to send warning." };
  }
}
