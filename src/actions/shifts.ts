"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { canPostShift, incrementShiftUsage } from "@/lib/subscription";
import type { ActionResult } from "@/types";
import type { WorkerRole } from "@prisma/client";

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};
function getStateName(abbr: string): string {
  return STATE_NAMES[abbr.toUpperCase()] || abbr;
}

// ─── Create Shift (Provider only) ───────────────────────────────

interface CreateShiftInput {
  role: WorkerRole;
  title?: string;
  location: string;
  startTime: string;
  endTime: string;
  payRate: number;
  notes?: string;
  minExperience?: number;
}

export async function createShift(input: CreateShiftInput): Promise<ActionResult<{ id: string }>> {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") {
    return { success: false, error: "Only providers can create shifts." };
  }

  if (!input.role || !input.location || !input.startTime || !input.endTime || !input.payRate) {
    return { success: false, error: "Missing required fields." };
  }

  const startTime = new Date(input.startTime);
  const endTime = new Date(input.endTime);

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return { success: false, error: "Invalid date/time." };
  }
  if (endTime <= startTime) {
    return { success: false, error: "End time must be after start time." };
  }
  if (startTime < new Date()) {
    return { success: false, error: "Cannot create shifts in the past." };
  }
  if (input.payRate <= 0) {
    return { success: false, error: "Pay rate must be positive." };
  }

  // Check + create + increment in a single transaction to prevent race conditions
  const canPost = await canPostShift(user.id);
  if (!canPost.allowed) {
    return { success: false, error: canPost.reason };
  }

  try {
    const shift = await db.$transaction(async (tx) => {
      // Re-check usage inside transaction for safety
      const profile = await tx.providerProfile.findUnique({ where: { userId: user.id } });
      if (!profile) throw new Error("Provider profile not found.");

      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const usage = await tx.usageTracking.findUnique({
        where: {
          providerProfileId_periodStart: {
            providerProfileId: profile.id,
            periodStart,
          },
        },
      });

      const { PLAN_LIMITS } = await import("@/types");
      const plan = await import("@/lib/subscription").then(m => m.getProviderPlan(user.id));
      const limits = PLAN_LIMITS[plan];
      const currentUsage = usage?.shiftsPosted ?? 0;

      if (currentUsage >= limits.shiftsPerMonth) {
        throw new Error(`You've reached your ${limits.shiftsPerMonth} shift limit. Upgrade to post more.`);
      }

      // Create the shift
      const newShift = await tx.shift.create({
        data: {
          providerId: user.id,
          role: input.role,
          title: input.title || null,
          location: input.location,
          startTime,
          endTime,
          payRate: input.payRate,
          notes: input.notes || null,
          status: "OPEN",
          minExperience: input.minExperience || null,
        },
      });

      // Atomically increment usage
      await tx.usageTracking.upsert({
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

      return newShift;
    });

    return { success: true, data: { id: shift.id } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create shift.";
    return { success: false, error: message };
  }
}

// ─── Edit Shift (Provider) ───────────────────────────────────────

interface EditShiftInput {
  role?: WorkerRole;
  title?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  payRate?: number;
  notes?: string;
  minExperience?: number | null;
}

export async function editShift(shiftId: string, input: EditShiftInput): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") {
    return { success: false, error: "Only providers can edit shifts." };
  }

  const shift = await db.shift.findUnique({ where: { id: shiftId } });
  if (!shift || shift.providerId !== user.id) {
    return { success: false, error: "Shift not found." };
  }
  if (shift.status === "COMPLETED" || shift.status === "CANCELLED") {
    return { success: false, error: "Cannot edit a completed or cancelled shift." };
  }

  const data: Record<string, unknown> = {};

  if (input.role !== undefined) data.role = input.role;
  if (input.title !== undefined) data.title = input.title || null;
  if (input.location !== undefined) {
    if (!input.location.trim()) return { success: false, error: "Location cannot be empty." };
    data.location = input.location.trim();
  }
  if (input.startTime !== undefined) {
    const st = new Date(input.startTime);
    if (isNaN(st.getTime())) return { success: false, error: "Invalid start time." };
    data.startTime = st;
  }
  if (input.endTime !== undefined) {
    const et = new Date(input.endTime);
    if (isNaN(et.getTime())) return { success: false, error: "Invalid end time." };
    data.endTime = et;
  }
  if (input.payRate !== undefined) {
    if (input.payRate <= 0) return { success: false, error: "Pay rate must be positive." };
    data.payRate = input.payRate;
  }
  if (input.notes !== undefined) data.notes = input.notes || null;
  if (input.minExperience !== undefined) data.minExperience = input.minExperience;

  // Validate times if both provided
  const newStart = (data.startTime as Date) ?? shift.startTime;
  const newEnd = (data.endTime as Date) ?? shift.endTime;
  if (newEnd <= newStart) {
    return { success: false, error: "End time must be after start time." };
  }

  data.version = { increment: 1 };

  await db.shift.update({
    where: { id: shiftId },
    data,
  });

  return { success: true };
}

// ─── Get Provider's Shifts ───────────────────────────────────────

export async function getProviderShifts() {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") return [];

  return db.shift.findMany({
    where: { providerId: user.id },
    include: {
      assignedWorker: { select: { name: true } },
      assignments: {
        include: {
          workerProfile: {
            include: { user: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });
}

// ─── Get Available Shifts (Worker) ───────────────────────────────
// Shows only shifts matching the worker's role.
// Provider preferences (minExperience) filter server-side.

export async function getAvailableShifts(filters?: {
  role?: WorkerRole;
}) {
  const user = await getSessionUser();
  if (user.role !== "WORKER") return [];

  // Get worker's profile to match against provider preferences and location
  const workerProfile = await db.workerProfile.findUnique({
    where: { userId: user.id },
    select: { workerRole: true, yearsExperience: true, city: true, state: true, workAreas: true, serviceRadiusMiles: true },
  });

  const where: Record<string, unknown> = {
    status: "OPEN",
    startTime: { gt: new Date() },
  };

  // Only show shifts matching the worker's role
  if (workerProfile?.workerRole) {
    where.role = workerProfile.workerRole;
  }
  // Override with explicit filter if provided
  if (filters?.role) {
    where.role = filters.role;
  }

  const shifts = await db.shift.findMany({
    where,
    include: {
      provider: {
        select: {
          name: true,
          providerProfile: { select: { companyName: true, city: true, state: true } },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  // Apply provider preference filters (can't be done in Prisma where easily)
  return shifts.filter((shift) => {
    // Check minimum experience requirement
    if (shift.minExperience != null && workerProfile?.yearsExperience != null) {
      if (workerProfile.yearsExperience < shift.minExperience) return false;
    }
    // Location filter
    // If worker has a service radius set, we can't calculate actual distance
    // without geocoding, so we do a best-effort text match but are lenient.
    // If service radius is large (100+ miles), show all shifts in the same state.
    // If worker has specific work areas, match against shift location text.
    if (workerProfile) {
      const hasWorkAreas = workerProfile.workAreas && workerProfile.workAreas.length > 0;
      const hasLargeRadius = (workerProfile.serviceRadiusMiles ?? 0) >= 100;
      const shiftLoc = shift.location.toLowerCase();

      if (hasLargeRadius && workerProfile.state) {
        // Large radius: show all shifts in the same state
        const stateAbbr = workerProfile.state.toLowerCase();
        const stateName = getStateName(workerProfile.state).toLowerCase();
        const matchesState = shiftLoc.includes(stateAbbr) || shiftLoc.includes(stateName);
        if (!matchesState) return false;
      } else if (hasWorkAreas) {
        // Specific work areas: match city names bidirectionally
        const searchTerms: string[] = [];
        // Add work area city names (extract city from "City, State" format)
        for (const area of workerProfile.workAreas!) {
          const city = area.split(",")[0].trim().toLowerCase();
          if (city.length >= 3) searchTerms.push(city);
        }
        // Add home city
        if (workerProfile.city) {
          searchTerms.push(workerProfile.city.toLowerCase());
        }
        // Check if shift location contains any of the worker's areas, OR
        // if any search term appears in the shift location
        if (searchTerms.length > 0) {
          const matchesArea = searchTerms.some((term) => shiftLoc.includes(term));
          if (!matchesArea) return false;
        }
      }
      // No work areas and no large radius = show all shifts (no location filter)
    }
    return true;
  });
}

// ─── Accept Shift (Worker) — OPTION A: Hard Assignment ───────────
// Transaction-safe. Only one worker can secure a shift.
// Uses optimistic locking via version field.

export async function acceptShift(shiftId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "WORKER") {
    return { success: false, error: "Only workers can accept shifts." };
  }

  const workerProfile = await db.workerProfile.findUnique({
    where: { userId: user.id },
  });
  if (!workerProfile) {
    return { success: false, error: "Complete your profile first." };
  }

  try {
    await db.$transaction(async (tx) => {
      // 1. Read current shift state
      const shift = await tx.shift.findUnique({
        where: { id: shiftId },
      });

      if (!shift) throw new Error("Shift not found.");
      if (shift.status !== "OPEN") throw new Error("This shift is no longer available.");
      if (shift.assignedWorkerId) throw new Error("This shift has already been assigned.");

      // 2. Check for time overlap with worker's other shifts
      const overlapping = await tx.shift.findFirst({
        where: {
          assignedWorkerId: user.id,
          status: "ASSIGNED",
          startTime: { lt: shift.endTime },
          endTime: { gt: shift.startTime },
        },
      });
      if (overlapping) throw new Error("You already have a shift during this time.");

      // 3. Check for duplicate assignment
      const existing = await tx.assignment.findUnique({
        where: {
          shiftId_workerProfileId: {
            shiftId: shift.id,
            workerProfileId: workerProfile.id,
          },
        },
      });
      if (existing) throw new Error("You have already applied to this shift.");

      // 4. Atomically assign with optimistic lock
      const updated = await tx.shift.updateMany({
        where: {
          id: shiftId,
          status: "OPEN",
          assignedWorkerId: null,
          version: shift.version,
        },
        data: {
          status: "ASSIGNED",
          assignedWorkerId: user.id,
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        throw new Error("This shift was just taken by another worker.");
      }

      // 5. Create assignment record
      await tx.assignment.create({
        data: {
          shiftId: shift.id,
          workerProfileId: workerProfile.id,
          status: "ACCEPTED",
        },
      });
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to accept shift.";
    return { success: false, error: message };
  }
}

// ─── Cancel Shift (Provider) ─────────────────────────────────────

export async function cancelShift(shiftId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") {
    return { success: false, error: "Only providers can cancel shifts." };
  }

  const shift = await db.shift.findUnique({ where: { id: shiftId } });
  if (!shift || shift.providerId !== user.id) {
    return { success: false, error: "Shift not found." };
  }
  if (shift.status === "COMPLETED" || shift.status === "CANCELLED") {
    return { success: false, error: "Cannot cancel this shift." };
  }

  await db.$transaction(async (tx) => {
    await tx.shift.update({
      where: { id: shiftId },
      data: { status: "CANCELLED", version: { increment: 1 } },
    });
    await tx.assignment.updateMany({
      where: {
        shiftId,
        status: { in: ["REQUESTED", "HELD", "ACCEPTED", "CONFIRMED"] },
      },
      data: { status: "CANCELLED" },
    });
  });

  return { success: true };
}

// ─── Complete Shift (Provider) ───────────────────────────────────

export async function completeShift(shiftId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") {
    return { success: false, error: "Only providers can complete shifts." };
  }

  const shift = await db.shift.findUnique({ where: { id: shiftId } });
  if (!shift || shift.providerId !== user.id) {
    return { success: false, error: "Shift not found." };
  }
  if (shift.status !== "ASSIGNED") {
    return { success: false, error: "Only assigned shifts can be completed." };
  }

  await db.$transaction(async (tx) => {
    await tx.shift.update({
      where: { id: shiftId },
      data: { status: "COMPLETED", version: { increment: 1 } },
    });
    await tx.assignment.updateMany({
      where: { shiftId, status: "ACCEPTED" },
      data: { status: "CONFIRMED" },
    });
  });

  return { success: true };
}

// ─── Get Shift Details ───────────────────────────────────────────

export async function getShiftById(shiftId: string) {
  return db.shift.findUnique({
    where: { id: shiftId },
    include: {
      provider: {
        select: {
          name: true,
          providerProfile: { select: { companyName: true, city: true, state: true } },
        },
      },
      assignedWorker: { select: { name: true } },
      assignments: {
        include: {
          workerProfile: {
            include: {
              user: { select: { name: true } },
              credentials: { where: { status: "VERIFIED" }, select: { type: true, name: true } },
            },
          },
        },
      },
    },
  });
}

// ─── Worker's Accepted Shifts ────────────────────────────────────

export async function getWorkerShifts() {
  const user = await getSessionUser();
  if (user.role !== "WORKER") return [];

  return db.shift.findMany({
    where: { assignedWorkerId: user.id },
    include: {
      provider: {
        select: {
          name: true,
          providerProfile: { select: { companyName: true } },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });
}
