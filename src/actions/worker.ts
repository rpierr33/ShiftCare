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

export async function updateWorkerProfile(input: UpdateWorkerProfileInput): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "WORKER") {
    return { success: false, error: "Only workers can update worker profiles." };
  }

  const profile = await db.workerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    return { success: false, error: "Worker profile not found." };
  }

  const hasRole = !!input.workerRole;
  const hasLocation = !!(input.city && input.state);
  const profileComplete = hasRole && hasLocation;

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

  revalidatePath("/worker/shifts");
  revalidatePath("/worker/my-shifts");

  return { success: true };
}

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
  return {
    ...profile,
    totalEarnings: parseFloat(String(profile.totalEarnings)),
  };
}

export async function initiateStripeConnect(): Promise<ActionResult<{ url: string }>> {
  const user = await getSessionUser();
  if (user.role !== "WORKER") return { success: false, error: "Only workers can set up payouts." };

  try {
    const { createWorkerConnectAccount } = await import("@/lib/stripe-actions");
    const url = await createWorkerConnectAccount(user.id);
    return { success: true, data: { url } };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to set up payouts.";
    return { success: false, error: msg };
  }
}

export async function getAvailableWorkers(filters?: {
  role?: WorkerRole;
  state?: string;
}) {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") return [];

  const where: Record<string, unknown> = {
    isAvailable: true,
    profileComplete: true,
  };

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
