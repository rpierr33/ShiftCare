"use server";

import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";
import type { Strike } from "@prisma/client";

// Returns all active (non-decayed) strikes for a user, newest first
export async function getActiveStrikes(userId: string): Promise<Strike[]> {
  return db.strike.findMany({
    where: {
      userId,
      decayedAt: null, // null = still active; non-null = decayed/expired
    },
    orderBy: { createdAt: "desc" },
  });
}

// Returns the count of active strikes for a user
export async function getActiveStrikeCount(userId: string): Promise<number> {
  return db.strike.count({
    where: {
      userId,
      decayedAt: null,
    },
  });
}

// Calculates the visibility multiplier for shift recommendations
// Workers with strikes see fewer shifts; 3+ strikes = fully suspended (0x visibility)
export async function getVisibilityMultiplier(userId: string): Promise<number> {
  const count = await getActiveStrikeCount(userId);
  if (count === 0) return 1.0;   // Full visibility
  if (count === 1) return 0.75;  // 75% of shifts shown
  if (count === 2) return 0.5;   // 50% of shifts shown
  return 0.0;                    // 3+ strikes = suspended, no shifts visible
}

// Checks if a worker is currently suspended (3+ active strikes or manual suspension)
export async function checkSuspension(userId: string): Promise<boolean> {
  const [strikeCount, user] = await Promise.all([
    getActiveStrikeCount(userId),
    db.user.findUnique({ where: { id: userId }, select: { isSuspended: true } }),
  ]);
  return strikeCount >= 3 || (user?.isSuspended === true);
}

// Records a strike against a worker and handles auto-suspension at 3 strikes
export async function recordStrike(
  userId: string,
  type: "NO_SHOW" | "LATE_CANCEL",
  shiftId: string
): Promise<void> {
  // Create the strike record
  await db.strike.create({
    data: {
      userId,
      type,
      shiftId,
    },
  });

  const activeCount = await getActiveStrikeCount(userId);

  // Auto-suspend at 3 strikes
  if (activeCount >= 3) {
    await db.user.update({
      where: { id: userId },
      data: {
        isSuspended: true,
        suspendedAt: new Date(),
      },
    });

    // Notify worker of suspension
    await sendNotification({
      userId,
      type: "ACCOUNT_SUSPENDED",
      title: "Account Suspended",
      body: "Your account has been suspended due to 3 active strikes. Strikes decay after 90 days of good standing.",
      channels: ["inapp", "push"],
    });
  } else {
    // Notify worker of the strike (below suspension threshold)
    const body =
      type === "NO_SHOW"
        ? `You received a no-show strike. You now have ${activeCount} active strike(s). At 3 strikes your account will be suspended.`
        : `You received a late cancellation strike. You now have ${activeCount} active strike(s). At 3 strikes your account will be suspended.`;

    await sendNotification({ userId, type: "STRIKE_RECORDED", title: "Strike Recorded", body, channels: ["inapp", "push"] });
  }

  // Recalculate reliability score after strike
  await updateReliabilityScore(userId);
}

// Decays (expires) old strikes — called by a cron job
// Logic: if a user's most recent active strike is older than 90 days, decay their oldest active strike
// This creates a "90 days of good standing" window before strikes start falling off
export async function decayStrikes(): Promise<number> {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  let decayedCount = 0;

  // Find all users who have at least one active strike
  const usersWithStrikes = await db.strike.findMany({
    where: { decayedAt: null },
    select: { userId: true },
    distinct: ["userId"],
  });

  for (const { userId } of usersWithStrikes) {
    // Get the most recent active strike for this user
    const mostRecent = await db.strike.findFirst({
      where: { userId, decayedAt: null },
      orderBy: { createdAt: "desc" },
    });

    // Only decay if the most recent strike is older than 90 days
    // (meaning 90 days have passed without a new strike)
    if (!mostRecent || mostRecent.createdAt > ninetyDaysAgo) {
      continue;
    }

    // Decay the oldest active strike first (FIFO)
    const oldest = await db.strike.findFirst({
      where: { userId, decayedAt: null },
      orderBy: { createdAt: "asc" },
    });

    if (oldest) {
      await db.strike.update({
        where: { id: oldest.id },
        data: { decayedAt: now },
      });
      decayedCount++;
    }

    // Check if user should be unsuspended (dropped below 3 active strikes)
    const remainingActive = await getActiveStrikeCount(userId);
    if (remainingActive < 3) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { isSuspended: true },
      });

      // Lift suspension if it was active
      if (user?.isSuspended) {
        await db.user.update({
          where: { id: userId },
          data: {
            isSuspended: false,
            suspendedAt: null,
          },
        });

        await sendNotification({
          userId,
          type: "SUSPENSION_LIFTED",
          title: "Suspension Lifted",
          body: "A strike has decayed and your account suspension has been lifted. You can now accept shifts again.",
          channels: ["inapp", "push"],
        });
      }
    }

    // Recalculate reliability score after decay
    await updateReliabilityScore(userId);
  }

  return decayedCount;
}

// Determines if a cancellation qualifies as "late" (within 4 hours of shift start)
// Late cancellations incur a strike penalty
export function isLateCancellation(shiftStartTime: Date): boolean {
  const now = new Date();
  const hoursUntilShift =
    (shiftStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilShift < 4;
}

// Simple DJB2 hash function — used for deterministic bucketing (e.g., A/B tests, feature flags)
export function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // Convert to unsigned 32-bit integer
}

// Recalculates a worker's reliability score based on their assignment history and active strikes
// Score formula: (confirmed / total) * 100 - (activeStrikes * 10), clamped to [0, 100]
export async function updateReliabilityScore(userId: string): Promise<void> {
  const workerProfile = await db.workerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!workerProfile) return;

  const [totalAssignments, completedAssignments, activeStrikes] =
    await Promise.all([
      // Total assignments ever created for this worker
      db.assignment.count({
        where: { workerProfileId: workerProfile.id },
      }),
      // Only CONFIRMED assignments count as completed
      db.assignment.count({
        where: { workerProfileId: workerProfile.id, status: "CONFIRMED" },
      }),
      getActiveStrikeCount(userId),
    ]);

  let score: number;
  if (totalAssignments === 0) {
    score = 100; // Default score for new workers with no history
  } else {
    // Base score from completion rate, penalized by active strikes
    score =
      (completedAssignments / totalAssignments) * 100 - activeStrikes * 10;
  }

  // Clamp between 0 and 100
  score = Math.max(0, Math.min(100, score));

  await db.workerProfile.update({
    where: { userId },
    data: { reliabilityScore: score },
  });
}
