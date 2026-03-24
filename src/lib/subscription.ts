"use server";

import { db } from "./db";
import { PLAN_LIMITS } from "@/types";
import type { SubscriptionPlan } from "@prisma/client";

export async function getProviderPlan(userId: string): Promise<SubscriptionPlan> {
  const profile = await db.providerProfile.findUnique({
    where: { userId },
    include: { subscription: true },
  });
  if (!profile?.subscription) return "FREE";
  if (profile.subscription.status !== "ACTIVE" && profile.subscription.status !== "TRIALING") {
    return "FREE";
  }
  return profile.subscription.plan;
}

export async function getUsageThisPeriod(userId: string) {
  const profile = await db.providerProfile.findUnique({ where: { userId } });
  if (!profile) return { shiftsPosted: 0, workerUnlocks: 0 };

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const usage = await db.usageTracking.findUnique({
    where: {
      providerProfileId_periodStart: {
        providerProfileId: profile.id,
        periodStart,
      },
    },
  });

  return {
    shiftsPosted: usage?.shiftsPosted ?? 0,
    workerUnlocks: usage?.workerUnlocks ?? 0,
  };
}

export async function canPostShift(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getProviderPlan(userId);
  const limits = PLAN_LIMITS[plan];
  const usage = await getUsageThisPeriod(userId);

  if (usage.shiftsPosted >= limits.shiftsPerMonth) {
    return {
      allowed: false,
      reason: `You've reached your ${limits.shiftsPerMonth} shift limit for this month. Upgrade to post more shifts.`,
    };
  }
  return { allowed: true };
}

export async function canUnlockWorker(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getProviderPlan(userId);
  const limits = PLAN_LIMITS[plan];
  const usage = await getUsageThisPeriod(userId);

  if (usage.workerUnlocks >= limits.workerUnlocksPerMonth) {
    return {
      allowed: false,
      reason: `You've reached your worker detail limit for this month. Upgrade to unlock more workers.`,
    };
  }
  return { allowed: true };
}

export async function incrementShiftUsage(userId: string): Promise<void> {
  const profile = await db.providerProfile.findUnique({ where: { userId } });
  if (!profile) return;

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  await db.usageTracking.upsert({
    where: {
      providerProfileId_periodStart: {
        providerProfileId: profile.id,
        periodStart,
      },
    },
    create: {
      providerProfileId: profile.id,
      periodStart,
      periodEnd,
      shiftsPosted: 1,
    },
    update: {
      shiftsPosted: { increment: 1 },
    },
  });
}

export async function incrementWorkerUnlock(userId: string): Promise<void> {
  const profile = await db.providerProfile.findUnique({ where: { userId } });
  if (!profile) return;

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  await db.usageTracking.upsert({
    where: {
      providerProfileId_periodStart: {
        providerProfileId: profile.id,
        periodStart,
      },
    },
    create: {
      providerProfileId: profile.id,
      periodStart,
      periodEnd,
      workerUnlocks: 1,
    },
    update: {
      workerUnlocks: { increment: 1 },
    },
  });
}
