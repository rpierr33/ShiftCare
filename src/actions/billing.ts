"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { getProviderPlan, getUsageThisPeriod } from "@/lib/subscription";
import { PLAN_LIMITS, PLAN_PRICES } from "@/types";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import type { SubscriptionPlan } from "@prisma/client";

/**
 * Get comprehensive subscription status for the current provider.
 * Includes plan, usage, limits, pricing, and cancellation info.
 * Returns null for non-providers.
 */
export async function getSubscriptionStatus() {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") return null;

  const profile = await db.providerProfile.findUnique({
    where: { userId: user.id },
    include: { subscription: true },
  });

  if (!profile) return null;

  const plan = await getProviderPlan(user.id);
  const usage = await getUsageThisPeriod(user.id);
  const limits = PLAN_LIMITS[plan];

  return {
    plan,
    status: profile.subscription?.status ?? "ACTIVE",
    usage,
    limits,
    price: PLAN_PRICES[plan],
    trialEndsAt: profile.subscription?.trialEndsAt,
    cancelAtPeriodEnd: profile.subscription?.cancelAtPeriodEnd ?? false,
  };
}

/**
 * Upgrade the provider's subscription plan. Provider-only.
 * NOTE: Stripe integration deferred. For MVP, plan updates directly in the database.
 */
export async function upgradePlan(newPlan: SubscriptionPlan): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") {
    return { success: false, error: "Only providers can manage subscriptions." };
  }

  if (!["STARTER", "PROFESSIONAL"].includes(newPlan)) {
    return { success: false, error: "Invalid plan." };
  }

  const profile = await db.providerProfile.findUnique({
    where: { userId: user.id },
    include: { subscription: true },
  });

  if (!profile) {
    return { success: false, error: "Provider profile not found." };
  }

  // NOTE: Stripe integration deferred. For MVP, plan updates directly in DB.
  if (profile.subscription) {
    await db.subscription.update({
      where: { id: profile.subscription.id },
      data: {
        plan: newPlan,
        status: "ACTIVE",
        cancelAtPeriodEnd: false,
      },
    });
  } else {
    // Create subscription if none exists (edge case)
    await db.subscription.create({
      data: {
        providerProfileId: profile.id,
        plan: newPlan,
        status: "ACTIVE",
      },
    });
  }

  // BUG FIX: Added missing revalidatePath after plan change
  revalidatePath("/agency/billing");
  revalidatePath("/agency/dashboard");

  return { success: true };
}

/**
 * Cancel the provider's subscription at end of current period. Provider-only.
 */
export async function cancelSubscription(): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") {
    return { success: false, error: "Only providers can manage subscriptions." };
  }

  const profile = await db.providerProfile.findUnique({
    where: { userId: user.id },
    include: { subscription: true },
  });

  if (!profile?.subscription) {
    return { success: false, error: "No active subscription." };
  }

  // Mark subscription for cancellation at period end (not immediate)
  await db.subscription.update({
    where: { id: profile.subscription.id },
    data: { cancelAtPeriodEnd: true },
  });

  // BUG FIX: Added missing revalidatePath after subscription cancellation
  revalidatePath("/agency/billing");

  return { success: true };
}
