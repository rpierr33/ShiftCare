"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import type { WorkerRole } from "@prisma/client";

/**
 * Provider onboarding input. Collects company info, agency-specific fields,
 * and contact details.
 */
interface ProviderOnboardingInput {
  companyName: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  description?: string;
  // Agency-specific
  npiNumber?: string;
  einNumber?: string;
  licenseNumber?: string;
  licenseState?: string;
  licenseExpiryDate?: string;
  contactPerson?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
}

/**
 * Complete the provider onboarding flow. Provider-only.
 * Upserts the provider profile with company info, ensures a subscription exists,
 * and marks the user's onboarding as completed.
 */
export async function completeProviderOnboarding(
  input: ProviderOnboardingInput
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") {
    return { success: false, error: "Only providers can complete provider onboarding." };
  }

  if (!input.companyName?.trim()) {
    return { success: false, error: "Company or employer name is required." };
  }

  await db.$transaction(async (tx) => {
    const existing = await tx.providerProfile.findUnique({ where: { userId: user.id } });
    const providerType = existing?.providerType ?? "AGENCY";

    await tx.providerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        providerType,
        companyName: input.companyName.trim(),
        phone: input.phone,
        address: input.address,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        description: input.description,
        npiNumber: input.npiNumber,
        einNumber: input.einNumber,
        licenseNumber: input.licenseNumber,
        licenseState: input.licenseState,
        licenseExpiryDate: input.licenseExpiryDate ? new Date(input.licenseExpiryDate) : undefined,
        contactPerson: input.contactPerson,
        contactPersonEmail: input.contactPersonEmail,
        contactPersonPhone: input.contactPersonPhone,
      },
      update: {
        companyName: input.companyName.trim(),
        phone: input.phone,
        address: input.address,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        description: input.description,
        npiNumber: input.npiNumber,
        einNumber: input.einNumber,
        licenseNumber: input.licenseNumber,
        licenseState: input.licenseState,
        licenseExpiryDate: input.licenseExpiryDate ? new Date(input.licenseExpiryDate) : undefined,
        contactPerson: input.contactPerson,
        contactPersonEmail: input.contactPersonEmail,
        contactPersonPhone: input.contactPersonPhone,
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

  // BUG FIX: Added missing revalidatePath after onboarding completion
  revalidatePath("/agency/dashboard");
  revalidatePath("/agency/shifts");

  return { success: true };
}

/**
 * Worker onboarding input. Collects role, location, credentials, and work preferences.
 */
interface WorkerOnboardingInput {
  workerRole: WorkerRole;
  city: string;
  state: string;
  zipCode?: string;
  phone?: string;
  workAreas?: string[];
  serviceRadiusMiles?: number;
  licenseNumber?: string;
  licenseState?: string;
  certifications?: string[];
}

/**
 * Complete the worker onboarding flow. Worker-only.
 * Upserts the worker profile with role, location, and credentials.
 * Sets a 30-day verification deadline and marks onboarding as completed.
 */
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
    // 30-day verification deadline from now
    const verificationDeadline = new Date();
    verificationDeadline.setDate(verificationDeadline.getDate() + 30);

    await tx.workerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        workerRole: input.workerRole,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        workAreas: input.workAreas || [],
        serviceRadiusMiles: input.serviceRadiusMiles,
        licenseNumber: input.licenseNumber,
        licenseState: input.licenseState,
        certifications: input.certifications || [],
        profileComplete: true,
        verificationDeadline,
        verificationStatus: "pending",
      },
      update: {
        workerRole: input.workerRole,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        workAreas: input.workAreas || [],
        serviceRadiusMiles: input.serviceRadiusMiles,
        licenseNumber: input.licenseNumber,
        licenseState: input.licenseState,
        certifications: input.certifications || [],
        profileComplete: true,
        verificationDeadline,
        verificationStatus: "pending",
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

  // BUG FIX: Added missing revalidatePath after onboarding completion
  revalidatePath("/worker/shifts");
  revalidatePath("/worker/profile");

  return { success: true };
}

// ---- Set user role (for Google OAuth users who signed up without a role) ----

/**
 * Set the role for a Google OAuth user who signed up without one.
 * Only allowed if the user's role is not already set.
 * Creates a provider profile if the role is PROVIDER.
 */
export async function setUserRole(
  role: "PROVIDER" | "WORKER",
  providerType?: "AGENCY" | "PRIVATE"
): Promise<ActionResult> {
  const user = await getSessionUser();

  // Only allow setting role if it's not already set
  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return { success: false, error: "User not found." };
  if (dbUser.role) return { success: false, error: "Role is already set." };

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { role },
    });

    // If provider, create initial provider profile with type
    if (role === "PROVIDER") {
      await tx.providerProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          providerType: providerType || "AGENCY",
          companyName: "",
        },
        update: {
          providerType: providerType || "AGENCY",
        },
      });
    }
  });

  return { success: true };
}

// ---- Get provider type for current user ----

/**
 * Returns the provider type (AGENCY or PRIVATE) for the current user.
 * Returns null for non-providers.
 */
export async function getProviderType(): Promise<string | null> {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") return null;
  const profile = await db.providerProfile.findUnique({
    where: { userId: user.id },
    select: { providerType: true },
  });
  return profile?.providerType ?? null;
}
