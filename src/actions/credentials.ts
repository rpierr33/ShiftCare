"use server";

import { db } from "@/lib/db";
import { getSessionUser, requireAdmin } from "@/lib/auth-utils";
import { notifyCredentialApproved, notifyCredentialRejected } from "@/lib/notifications";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

/**
 * Approve a worker's credential submission and update their verification status.
 * BUG FIX: Changed from PROVIDER role check to requireAdmin().
 * Previously any provider could approve credentials -- this is an admin-only operation.
 */
export async function approveCredential(
  workerId: string,
  expiryDate: string
): Promise<ActionResult> {
  try {
    // BUG FIX: Use requireAdmin() instead of PROVIDER role check
    await requireAdmin();

    // Validate the expiry date
    const expiry = new Date(expiryDate);
    if (isNaN(expiry.getTime())) {
      return { success: false, error: "Invalid expiry date." };
    }

    // Verify the worker profile exists
    const profile = await db.workerProfile.findUnique({
      where: { userId: workerId },
    });
    if (!profile) {
      return { success: false, error: "Worker profile not found." };
    }

    // Update credential status to VERIFIED with the expiry date
    await db.workerProfile.update({
      where: { userId: workerId },
      data: {
        credentialStatus: "VERIFIED",
        credentialExpiryDate: expiry,
        verificationStatus: "verified",
      },
    });

    // Notify the worker of the approval
    await notifyCredentialApproved(workerId);

    // BUG FIX: Added missing revalidatePath
    revalidatePath("/admin/credentials");

    return { success: true };
  } catch (error) {
    console.error("Failed to approve credential:", error);
    return { success: false, error: "Failed to approve credential." };
  }
}

/**
 * Reject a worker's credential submission with a reason.
 * Resets the credential status to PENDING and clears the document.
 * BUG FIX: Changed from PROVIDER role check to requireAdmin().
 */
export async function rejectCredential(
  workerId: string,
  reason: string
): Promise<ActionResult> {
  try {
    // BUG FIX: Use requireAdmin() instead of PROVIDER role check
    await requireAdmin();

    // Rejection reason is required
    if (!reason.trim()) {
      return { success: false, error: "Rejection reason is required." };
    }

    // Verify the worker profile exists
    const profile = await db.workerProfile.findUnique({
      where: { userId: workerId },
    });
    if (!profile) {
      return { success: false, error: "Worker profile not found." };
    }

    // Reset credential status and clear the uploaded document
    await db.workerProfile.update({
      where: { userId: workerId },
      data: {
        credentialStatus: "PENDING",
        credentialDocumentKey: null,
      },
    });

    // Notify the worker of the rejection with the reason
    await notifyCredentialRejected(workerId, reason);

    // BUG FIX: Added missing revalidatePath
    revalidatePath("/admin/credentials");

    return { success: true };
  } catch (error) {
    console.error("Failed to reject credential:", error);
    return { success: false, error: "Failed to reject credential." };
  }
}

/**
 * Get all credentials for the current worker.
 * Serializes dates to ISO strings for client component compatibility.
 * Worker-only.
 */
export async function getWorkerCredentials() {
  try {
    const sessionUser = await getSessionUser();
    // Only workers can view their own credentials
    if (sessionUser.role !== "WORKER") {
      return [];
    }

    // Get the worker profile ID first
    const profile = await db.workerProfile.findUnique({
      where: { userId: sessionUser.id },
      select: { id: true },
    });
    if (!profile) return [];

    // Fetch all credentials for this worker profile
    const credentials = await db.credential.findMany({
      where: { workerProfileId: profile.id },
      orderBy: { createdAt: "desc" },
    });

    // Serialize dates for client components (Date objects can't cross server/client boundary)
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

/**
 * Submit a license credential for verification.
 * Sets the credential status to PROVISIONAL, giving the worker 14 days
 * to accept shifts while admin reviews their credential.
 * Worker-only.
 */
export async function submitCredential(data: {
  licenseNumber: string;
  issuingState: string;
}): Promise<ActionResult> {
  try {
    const sessionUser = await getSessionUser();
    // Only workers can submit credentials
    if (sessionUser.role !== "WORKER") {
      return { success: false, error: "Only workers can submit credentials." };
    }

    // Validate required fields
    if (!data.licenseNumber.trim() || !data.issuingState.trim()) {
      return { success: false, error: "License number and issuing state are required." };
    }

    // Set PROVISIONAL status -- worker can accept shifts for 14 days while admin reviews
    await db.workerProfile.update({
      where: { userId: sessionUser.id },
      data: {
        licenseNumber: data.licenseNumber.trim(),
        licenseState: data.issuingState.trim(),
        credentialStatus: "PROVISIONAL",
        credentialSubmittedAt: new Date(),
      },
    });

    // BUG FIX: Added missing revalidatePath
    revalidatePath("/worker/profile");
    revalidatePath("/worker/shifts");

    return { success: true };
  } catch (error) {
    console.error("Failed to submit credential:", error);
    return { success: false, error: "Failed to submit credential." };
  }
}
