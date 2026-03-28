"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { notifyCredentialApproved, notifyCredentialRejected } from "@/lib/notifications";
import type { ActionResult } from "@/types";

export async function approveCredential(
  workerId: string,
  expiryDate: string
): Promise<ActionResult> {
  try {
    const sessionUser = await getSessionUser();
    // In a real app, you'd check for ADMIN role. For now, check PROVIDER role.
    if (sessionUser.role !== "PROVIDER") {
      return { success: false, error: "Unauthorized." };
    }

    const expiry = new Date(expiryDate);
    if (isNaN(expiry.getTime())) {
      return { success: false, error: "Invalid expiry date." };
    }

    const profile = await db.workerProfile.findUnique({
      where: { userId: workerId },
    });
    if (!profile) {
      return { success: false, error: "Worker profile not found." };
    }

    await db.workerProfile.update({
      where: { userId: workerId },
      data: {
        credentialStatus: "VERIFIED",
        credentialExpiryDate: expiry,
        verificationStatus: "verified",
      },
    });

    await notifyCredentialApproved(workerId);
    return { success: true };
  } catch (error) {
    console.error("Failed to approve credential:", error);
    return { success: false, error: "Failed to approve credential." };
  }
}

export async function rejectCredential(
  workerId: string,
  reason: string
): Promise<ActionResult> {
  try {
    const sessionUser = await getSessionUser();
    if (sessionUser.role !== "PROVIDER") {
      return { success: false, error: "Unauthorized." };
    }

    if (!reason.trim()) {
      return { success: false, error: "Rejection reason is required." };
    }

    const profile = await db.workerProfile.findUnique({
      where: { userId: workerId },
    });
    if (!profile) {
      return { success: false, error: "Worker profile not found." };
    }

    await db.workerProfile.update({
      where: { userId: workerId },
      data: {
        credentialStatus: "PENDING",
        credentialDocumentKey: null,
      },
    });

    await notifyCredentialRejected(workerId, reason);
    return { success: true };
  } catch (error) {
    console.error("Failed to reject credential:", error);
    return { success: false, error: "Failed to reject credential." };
  }
}

export async function getWorkerCredentials() {
  try {
    const sessionUser = await getSessionUser();
    if (sessionUser.role !== "WORKER") {
      return [];
    }

    const profile = await db.workerProfile.findUnique({
      where: { userId: sessionUser.id },
      select: { id: true },
    });
    if (!profile) return [];

    const credentials = await db.credential.findMany({
      where: { workerProfileId: profile.id },
      orderBy: { createdAt: "desc" },
    });

    // Serialize dates for client components
    return credentials.map((c) => ({
      id: c.id,
      type: c.type,
      name: c.name,
      licenseNumber: c.licenseNumber,
      issuingAuthority: c.issuingAuthority,
      issueDate: c.issueDate ? c.issueDate.toISOString() : null,
      expiryDate: c.expiryDate ? c.expiryDate.toISOString() : null,
      status: c.status,
      verifiedAt: c.verifiedAt ? c.verifiedAt.toISOString() : null,
      notes: c.notes,
      createdAt: c.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to fetch worker credentials:", error);
    return [];
  }
}

export async function submitCredential(data: {
  licenseNumber: string;
  issuingState: string;
}): Promise<ActionResult> {
  try {
    const sessionUser = await getSessionUser();
    if (sessionUser.role !== "WORKER") {
      return { success: false, error: "Only workers can submit credentials." };
    }

    if (!data.licenseNumber.trim() || !data.issuingState.trim()) {
      return { success: false, error: "License number and issuing state are required." };
    }

    // Set PROVISIONAL — worker can accept shifts for 14 days while admin reviews
    await db.workerProfile.update({
      where: { userId: sessionUser.id },
      data: {
        licenseNumber: data.licenseNumber.trim(),
        licenseState: data.issuingState.trim(),
        credentialStatus: "PROVISIONAL",
        credentialSubmittedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to submit credential:", error);
    return { success: false, error: "Failed to submit credential." };
  }
}
