"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

// ---- Mark Notifications as Read ----

/** Mark all unread notifications as read for the current provider. */
export async function markAllNotificationsRead(): Promise<ActionResult> {
  const user = await getSessionUser();

  await db.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });

  revalidatePath("/agency/notifications");
  return { success: true };
}

/** Mark a single notification as read. Verifies ownership before updating. */
export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  const user = await getSessionUser();

  const notification = await db.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== user.id) {
    return { success: false, error: "Notification not found." };
  }

  await db.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });

  revalidatePath("/agency/notifications");
  return { success: true };
}

// ---- Confirm Shift Completion ----

/**
 * Confirm a shift is completed after the end time has passed. Provider-only.
 * Calculates payment amounts, updates shift/assignment status, creates payment
 * and transaction records, and updates worker stats.
 */
export async function confirmShiftCompletion(shiftId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") {
    return { success: false, error: "Only providers can confirm shift completion." };
  }

  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    include: { assignedWorker: { select: { name: true } } },
  });

  if (!shift || shift.providerId !== user.id) {
    return { success: false, error: "Shift not found." };
  }
  if (shift.status !== "ASSIGNED") {
    return { success: false, error: "Only assigned shifts can be confirmed as complete." };
  }

  const now = new Date();
  if (now < shift.endTime) {
    return { success: false, error: "Cannot confirm completion before the shift end time." };
  }

  try {
    await db.$transaction(async (tx) => {
      // Calculate payment amounts
      const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
      const shiftAmount = Math.round(hours * shift.payRate * 100) / 100;
      const platformFee = Math.round(Math.max(shiftAmount * 0.10, 2.00) * 100) / 100;
      const workerPayout = Math.round((shiftAmount - platformFee) * 100) / 100;

      // Update shift to COMPLETED
      await tx.shift.update({
        where: { id: shiftId },
        data: {
          status: "COMPLETED",
          paymentStatus: "RELEASED",
          completionConfirmedAt: now,
          completionConfirmedBy: user.id,
          grossAmount: shiftAmount,
          platformFeeAmount: platformFee,
          workerPayoutAmount: workerPayout,
          version: { increment: 1 },
        },
      });

      // Update assignment
      await tx.assignment.updateMany({
        where: { shiftId, status: "ACCEPTED" },
        data: { status: "CONFIRMED" },
      });

      // Create shift payment record
      if (shift.assignedWorkerId) {
        await tx.shiftPayment.upsert({
          where: { shiftId },
          create: {
            shiftId,
            providerId: user.id,
            workerId: shift.assignedWorkerId,
            shiftAmount,
            platformFee,
            workerPayout,
            fundingStatus: "COMPLETED",
            payoutStatus: "AVAILABLE",
            fundedAt: now,
            completedAt: now,
          },
          update: {
            fundingStatus: "COMPLETED",
            payoutStatus: "AVAILABLE",
            completedAt: now,
          },
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            type: "SHIFT_FUNDING",
            status: "COMPLETED",
            amount: shiftAmount,
            platformFee,
            netAmount: workerPayout,
            shiftId,
            providerId: user.id,
            workerId: shift.assignedWorkerId,
            description: `Shift completed: ${shift.role} shift confirmed`,
            processedAt: now,
          },
        });

        // Update worker stats
        await tx.workerProfile.updateMany({
          where: { userId: shift.assignedWorkerId },
          data: {
            shiftsCompleted: { increment: 1 },
            totalEarnings: { increment: workerPayout },
          },
        });
      }
    });

    revalidatePath(`/agency/shifts/${shiftId}`);
    revalidatePath("/agency/shifts");
    revalidatePath("/agency/dashboard");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to confirm completion.";
    return { success: false, error: message };
  }
}

// ─── Dispute Shift ───────────────────────────────────────────────

/** Provider reports an issue with an assigned shift, placing payment on hold. */
export async function disputeShift(
  shiftId: string,
  issueType: string,
  description: string
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") {
    return { success: false, error: "Only providers can report issues." };
  }

  if (!issueType || !description?.trim()) {
    return { success: false, error: "Please provide an issue type and description." };
  }
  if (description.trim().length > 500) {
    return { success: false, error: "Description must be 500 characters or fewer." };
  }

  const shift = await db.shift.findUnique({ where: { id: shiftId } });
  if (!shift || shift.providerId !== user.id) {
    return { success: false, error: "Shift not found." };
  }
  if (shift.status !== "ASSIGNED") {
    return { success: false, error: "Only assigned shifts can be disputed." };
  }

  await db.shift.update({
    where: { id: shiftId },
    data: {
      status: "DISPUTED",
      disputeReason: `[${issueType}] ${description.trim()}`,
      paymentStatus: "HELD",
      version: { increment: 1 },
    },
  });

  revalidatePath(`/agency/shifts/${shiftId}`);
  revalidatePath("/agency/shifts");
  return { success: true };
}

// ─── Update Agency Profile ───────────────────────────────────────

/** Update the provider's agency profile with company, contact, and compliance details. */
export async function updateAgencyProfile(data: {
  companyName?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  website?: string;
  npiNumber?: string;
  einNumber?: string;
  licenseNumber?: string;
  licenseState?: string;
  licenseExpiryDate?: string;
  contactPerson?: string;
  contactTitle?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
}): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") {
    return { success: false, error: "Only providers can update profiles." };
  }

  const profile = await db.providerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return { success: false, error: "Provider profile not found." };
  }

  const { licenseExpiryDate, ...rest } = data;
  await db.providerProfile.update({
    where: { userId: user.id },
    data: {
      ...rest,
      ...(licenseExpiryDate !== undefined
        ? { licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : null }
        : {}),
    },
  });

  revalidatePath("/agency/settings");
  return { success: true };
}

// ─── Invite Worker to Shift ──────────────────────────────────────

/** Send a shift invitation notification to a specific worker. Provider-only. */
export async function inviteWorkerToShift(
  workerId: string,
  shiftId: string
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") {
    return { success: false, error: "Only providers can invite workers." };
  }

  const shift = await db.shift.findUnique({ where: { id: shiftId } });
  if (!shift || shift.providerId !== user.id) {
    return { success: false, error: "Shift not found." };
  }
  if (shift.status !== "OPEN") {
    return { success: false, error: "Only open shifts can receive invitations." };
  }

  // Create notification for the worker
  await db.notification.create({
    data: {
      userId: workerId,
      type: "shift_invitation",
      title: "You have been invited to a shift",
      // BUG FIX: Format payRate to 2 decimal places to avoid floating-point display issues
      body: `You have been invited to a ${shift.role} shift on ${shift.startTime.toLocaleDateString()} at ${shift.location}. Pay: $${shift.payRate.toFixed(2)}/hr.`,
      data: { shiftId: shift.id },
    },
  });

  return { success: true };
}
