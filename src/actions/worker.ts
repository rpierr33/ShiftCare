"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import type { ActionResult } from "@/types";
import type { WorkerRole } from "@prisma/client";

interface UpdateWorkerProfileInput {
  workerRole?: WorkerRole;
  licenseNumber?: string;
  licenseState?: string;
  certifications?: string[];
  bio?: string;
  hourlyRate?: number;
  yearsExperience?: number;
  serviceRadiusMiles?: number;
  city?: string;
  state?: string;
  zipCode?: string;
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
      hourlyRate: input.hourlyRate,
      yearsExperience: input.yearsExperience,
      serviceRadiusMiles: input.serviceRadiusMiles,
      city: input.city,
      state: input.state,
      zipCode: input.zipCode,
      profileComplete,
    },
  });

  return { success: true };
}

export async function getWorkerProfile() {
  const user = await getSessionUser();
  if (user.role !== "WORKER") return null;

  return db.workerProfile.findUnique({
    where: { userId: user.id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      credentials: true,
      availabilitySlots: true,
    },
  });
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
