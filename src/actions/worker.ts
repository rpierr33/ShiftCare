"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import type { WorkerRole } from "@prisma/client";

interface UpdateWorkerProfileInput {
  workerRole?: WorkerRole;
  licenseNumber?: string;
  licenseState?: string;
  certifications?: string[];
  bio?: string;
  yearsExperience?: number;
  serviceRadiusMiles?: number;
  city?: string;
  state?: string;
  zipCode?: string;
  workAreas?: string[];
}

/**
 * Update the current worker's profile fields.
 * Recalculates profileComplete based on role + location presence.
 * Worker-only.
 */
export async function updateWorkerProfile(input: UpdateWorkerProfileInput): Promise<ActionResult> {
  const user = await getSessionUser();
  // Only workers can update their own profile
  if (user.role !== "WORKER") {
    return { success: false, error: "Only workers can update worker profiles." };
  }

  // Verify profile exists
  const profile = await db.workerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    return { success: false, error: "Worker profile not found." };
  }

  // Determine if profile is complete (requires role + location)
  const hasRole = !!input.workerRole;
  const hasLocation = !!(input.city && input.state);
  const profileComplete = hasRole && hasLocation;

  // Update profile with all provided fields
  await db.workerProfile.update({
    where: { userId: user.id },
    data: {
      workerRole: input.workerRole,
      licenseNumber: input.licenseNumber,
      licenseState: input.licenseState,
      certifications: input.certifications || [],
      bio: input.bio,
      yearsExperience: input.yearsExperience,
      serviceRadiusMiles: input.serviceRadiusMiles,
      city: input.city,
      state: input.state,
      zipCode: input.zipCode,
      workAreas: input.workAreas || [],
      profileComplete,
    },
  });

  // Revalidate pages that depend on worker profile data
  revalidatePath("/worker/shifts");
  revalidatePath("/worker/my-shifts");
  revalidatePath("/worker/profile");

  return { success: true };
}

/**
 * Get the current worker's full profile including user info, credentials, and availability.
 * Serializes Decimal field (totalEarnings) to a number for client components.
 * Returns null for non-workers.
 */
export async function getWorkerProfile() {
  const user = await getSessionUser();
  if (user.role !== "WORKER") return null;

  const profile = await db.workerProfile.findUnique({
    where: { userId: user.id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      credentials: true,
      availabilitySlots: true,
    },
  });

  if (!profile) return null;

  // Serialize Decimal fields to numbers for client components
  // totalEarnings is a Prisma Decimal type which serializes as a string
  return {
    ...profile,
    totalEarnings: parseFloat(String(profile.totalEarnings)),
  };
}

/**
 * Initiate Stripe Connect onboarding for the current worker.
 * Returns a URL to redirect the worker to Stripe's hosted onboarding flow.
 * Worker-only.
 */
export async function initiateStripeConnect(): Promise<ActionResult<{ url: string }>> {
  const user = await getSessionUser();
  if (user.role !== "WORKER") return { success: false, error: "Only workers can set up payouts." };

  try {
    // Dynamic import to keep Stripe dependency lazy
    const { createWorkerConnectAccount } = await import("@/lib/stripe-actions");
    const url = await createWorkerConnectAccount(user.id);
    return { success: true, data: { url } };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to set up payouts.";
    return { success: false, error: msg };
  }
}

/**
 * Get available workers for providers to browse.
 * Provider-only. Filters by role and state if specified.
 * Only shows workers with complete profiles who are marked as available.
 */
export async function getAvailableWorkers(filters?: {
  role?: WorkerRole;
  state?: string;
}) {
  const user = await getSessionUser();
  // Only providers can browse workers
  if (user.role !== "PROVIDER") return [];

  // Build query filter for available, complete profiles
  const where: Record<string, unknown> = {
    isAvailable: true,
    profileComplete: true,
  };

  // Apply optional role and state filters
  if (filters?.role) where.workerRole = filters.role;
  if (filters?.state) where.state = filters.state;

  return db.workerProfile.findMany({
    where,
    include: {
      user: { select: { name: true } },
      credentials: {
        where: { status: "VERIFIED" },
        select: { type: true, name: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
}
