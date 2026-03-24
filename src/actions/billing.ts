"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { getProviderPlan, getUsageThisPeriod } from "@/lib/subscription";
import { PLAN_LIMITS, PLAN_PRICES } from "@/types";
import type { ActionResult } from "@/types";
import type { SubscriptionPlan } from "@prisma/client";

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

  // NOTE: Stripe integration deferred. For MVP, plan updates directly.
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
    await db.subscription.create({
      data: {
        providerProfileId: profile.id,
        plan: newPlan,
        status: "ACTIVE",
      },
    });
  }

  return { success: true };
}

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

  await db.subscription.update({
    where: { id: profile.subscription.id },
    data: { cancelAtPeriodEnd: true },
  });

  return { success: true };
}
