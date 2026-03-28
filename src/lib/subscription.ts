"use server";

import { db } from "./db";
import { PLAN_LIMITS } from "@/types";
import type { SubscriptionPlan } from "@prisma/client";

// Returns the current subscription plan for a provider user
// Falls back to FREE if no active/trialing subscription exists
export async function getProviderPlan(userId: string): Promise<SubscriptionPlan> {
  const profile = await db.providerProfile.findUnique({
    where: { userId },
    include: { subscription: true },
  });
  // No profile or no subscription record = FREE tier
  if (!profile?.subscription) return "FREE";
  // Only ACTIVE and TRIALING statuses count — CANCELLED, PAST_DUE, etc. revert to FREE
  if (profile.subscription.status !== "ACTIVE" && profile.subscription.status !== "TRIALING") {
    return "FREE";
  }
  return profile.subscription.plan;
}

// Returns the provider's usage counts for the current billing period (calendar month)
export async function getUsageThisPeriod(userId: string) {
  const profile = await db.providerProfile.findUnique({ where: { userId } });
  if (!profile) return { shiftsPosted: 0, workerUnlocks: 0 };

  // Billing period = calendar month (1st to 1st)
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

// Checks if a provider can post another shift within their plan limits
export async function canPostShift(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getProviderPlan(userId);
  const limits = PLAN_LIMITS[plan];
  const usage = await getUsageThisPeriod(userId);

  // Compare current usage against plan limit
  if (usage.shiftsPosted >= limits.shiftsPerMonth) {
    return {
      allowed: false,
      reason: `You've reached your ${limits.shiftsPerMonth} shift limit for this month. Upgrade to post more shifts.`,
    };
  }
  return { allowed: true };
}

// Checks if a provider can unlock another worker's details within their plan limits
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

// Increments the shift posting counter for the current billing period
// Uses upsert to create the usage record if it doesn't exist yet
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

// Increments the worker unlock counter for the current billing period
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
