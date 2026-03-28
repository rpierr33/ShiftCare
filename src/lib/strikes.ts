"use server";

import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";
import type { Strike } from "@prisma/client";

export async function getActiveStrikes(userId: string): Promise<Strike[]> {
  return db.strike.findMany({
    where: {
      userId,
      decayedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getActiveStrikeCount(userId: string): Promise<number> {
  return db.strike.count({
    where: {
      userId,
      decayedAt: null,
    },
  });
}

export async function getVisibilityMultiplier(userId: string): Promise<number> {
  const count = await getActiveStrikeCount(userId);
  if (count === 0) return 1.0;
  if (count === 1) return 0.75;
  if (count === 2) return 0.5;
  return 0.0; // 3+ strikes = suspended
}

export async function checkSuspension(userId: string): Promise<boolean> {
  const [strikeCount, user] = await Promise.all([
    getActiveStrikeCount(userId),
    db.user.findUnique({ where: { id: userId }, select: { isSuspended: true } }),
  ]);
  return strikeCount >= 3 || (user?.isSuspended === true);
}

export async function recordStrike(
  userId: string,
  type: "NO_SHOW" | "LATE_CANCEL",
  shiftId: string
): Promise<void> {
  await db.strike.create({
    data: {
      userId,
      type,
      shiftId,
    },
  });

  const activeCount = await getActiveStrikeCount(userId);

  if (activeCount >= 3) {
    await db.user.update({
      where: { id: userId },
      data: {
        isSuspended: true,
        suspendedAt: new Date(),
      },
    });

    await sendNotification({
      userId,
      type: "ACCOUNT_SUSPENDED",
      title: "Account Suspended",
      body: "Your account has been suspended due to 3 active strikes. Strikes decay after 90 days of good standing.",
      channels: ["inapp", "push"],
    });
  } else {
    const body =
      type === "NO_SHOW"
        ? `You received a no-show strike. You now have ${activeCount} active strike(s). At 3 strikes your account will be suspended.`
        : `You received a late cancellation strike. You now have ${activeCount} active strike(s). At 3 strikes your account will be suspended.`;

    await sendNotification({ userId, type: "STRIKE_RECORDED", title: "Strike Recorded", body, channels: ["inapp", "push"] });
  }

  await updateReliabilityScore(userId);
}

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

    if (!mostRecent || mostRecent.createdAt > ninetyDaysAgo) {
      continue; // Most recent strike is less than 90 days old
    }

    // Decay the oldest active strike
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

    // Check if all strikes are now decayed
    const remainingActive = await getActiveStrikeCount(userId);
    if (remainingActive < 3) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { isSuspended: true },
      });

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

    await updateReliabilityScore(userId);
  }

  return decayedCount;
}

export function isLateCancellation(shiftStartTime: Date): boolean {
  const now = new Date();
  const hoursUntilShift =
    (shiftStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilShift < 4;
}

export function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // Convert to unsigned 32-bit integer
}

export async function updateReliabilityScore(userId: string): Promise<void> {
  const workerProfile = await db.workerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!workerProfile) return;

  const [totalAssignments, completedAssignments, activeStrikes] =
    await Promise.all([
      db.assignment.count({
        where: { workerProfileId: workerProfile.id },
      }),
      db.assignment.count({
        where: { workerProfileId: workerProfile.id, status: "CONFIRMED" },
      }),
      getActiveStrikeCount(userId),
    ]);

  let score: number;
  if (totalAssignments === 0) {
    score = 100; // Default score for new workers
  } else {
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
