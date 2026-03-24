"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import type { ActionResult } from "@/types";
import type { WorkerRole } from "@prisma/client";

interface ProviderOnboardingInput {
  companyName: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  description?: string;
}

export async function completeProviderOnboarding(
  input: ProviderOnboardingInput
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") {
    return { success: false, error: "Only providers can complete provider onboarding." };
  }

  if (!input.companyName?.trim()) {
    return { success: false, error: "Company name is required." };
  }

  await db.$transaction(async (tx) => {
    await tx.providerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        companyName: input.companyName.trim(),
        phone: input.phone,
        address: input.address,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        description: input.description,
      },
      update: {
        companyName: input.companyName.trim(),
        phone: input.phone,
        address: input.address,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        description: input.description,
      },
    });

    // Ensure subscription exists
    const profile = await tx.providerProfile.findUnique({ where: { userId: user.id } });
    if (profile) {
      await tx.subscription.upsert({
        where: { providerProfileId: profile.id },
        create: {
          providerProfileId: profile.id,
          plan: "FREE",
          status: "ACTIVE",
        },
        update: {},
      });
    }

    await tx.user.update({
      where: { id: user.id },
      data: { onboardingCompleted: true },
    });
  });

  return { success: true };
}

interface WorkerOnboardingInput {
  workerRole: WorkerRole;
  city: string;
  state: string;
  zipCode?: string;
  phone?: string;
}

export async function completeWorkerOnboarding(
  input: WorkerOnboardingInput
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "WORKER") {
    return { success: false, error: "Only workers can complete worker onboarding." };
  }

  if (!input.workerRole || !input.city || !input.state) {
    return { success: false, error: "Role, city, and state are required." };
  }

  await db.$transaction(async (tx) => {
    await tx.workerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        workerRole: input.workerRole,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        profileComplete: true,
      },
      update: {
        workerRole: input.workerRole,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        profileComplete: true,
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        onboardingCompleted: true,
        ...(input.phone ? { phone: input.phone } : {}),
      },
    });
  });

  return { success: true };
}
