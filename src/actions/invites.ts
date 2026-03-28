"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { sendNotification } from "@/lib/notifications";

/**
 * Toggle a worker's preferred status for the current provider.
 * Requires at least 1 completed shift with the worker. Provider-only.
 */
export async function togglePreferredWorker(
  workerId: string
): Promise<{ success: boolean; isPreferred: boolean; error?: string }> {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") {
    return { success: false, isPreferred: false, error: "Unauthorized" };
  }

  // Verify at least 1 completed shift with this worker
  const completedShift = await db.shift.findFirst({
    where: {
      providerId: user.id,
      assignedWorkerId: workerId,
      status: "COMPLETED",
    },
    select: { id: true },
  });

  if (!completedShift) {
    return {
      success: false,
      isPreferred: false,
      error: "Worker must have completed at least 1 shift with you",
    };
  }

  // Check if already preferred
  const existing = await db.preferredWorker.findUnique({
    where: {
      providerId_workerId: { providerId: user.id, workerId },
    },
  });

  if (existing) {
    await db.preferredWorker.delete({ where: { id: existing.id } });
    return { success: true, isPreferred: false };
  }

  await db.preferredWorker.create({
    data: { providerId: user.id, workerId },
  });

  return { success: true, isPreferred: true };
}

/** Get all preferred workers for the current provider with name and role. */
export async function getPreferredWorkers() {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") return [];

  return db.preferredWorker.findMany({
    where: { providerId: user.id },
    include: {
      worker: {
        select: {
          id: true,
          name: true,
          workerProfile: { select: { workerRole: true } },
        },
      },
    },
  });
}

/**
 * Send private shift invitations to all preferred workers of the shift's provider.
 * Called from createShift or directly. Does not require auth -- validates shift ownership.
 */
export async function sendPreferredInvites(
  shiftId: string
): Promise<{ success: boolean; invitesSent: number; error?: string }> {
  // This can be called from createShift (already authed) or directly
  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    select: {
      id: true,
      providerId: true,
      status: true,
      isPublic: true,
      role: true,
      startTime: true,
      location: true,
      payRate: true,
    },
  });

  if (!shift) {
    return { success: false, invitesSent: 0, error: "Shift not found" };
  }

  if (shift.status !== "OPEN") {
    return { success: false, invitesSent: 0, error: "Shift must be open" };
  }

  const preferred = await db.preferredWorker.findMany({
    where: { providerId: shift.providerId },
    select: { workerId: true },
  });

  if (preferred.length === 0) {
    return { success: false, invitesSent: 0, error: "No preferred workers found" };
  }

  const startDate = new Date(shift.startTime).toLocaleDateString();

  for (const { workerId } of preferred) {
    await sendNotification({
      userId: workerId,
      type: "SHIFT_INVITATION",
      title: "Private Shift Invite",
      body: `You've been invited to a ${shift.role} shift on ${startDate} at ${shift.location} — $${shift.payRate}/hr`,
      data: { shiftId: shift.id },
      channels: ["inapp", "push"],
    });
  }

  return { success: true, invitesSent: preferred.length };
}

/**
 * Publish all shifts whose private invite window has expired.
 * Makes them visible to all workers. Called by cron/scheduled task.
 */
export async function publishExpiredInvites(): Promise<number> {
  const result = await db.shift.updateMany({
    where: {
      isPublic: false,
      inviteExpiresAt: { lt: new Date() },
      status: "OPEN",
    },
    data: {
      isPublic: true,
      inviteExpiresAt: null,
    },
  });

  return result.count;
}
