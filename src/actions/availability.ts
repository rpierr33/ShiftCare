"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

// ─── Set Weekly Availability Slots (replace all existing) ─────────

export async function setWeeklyAvailability(
  slots: {
    dayOfWeek: string; // MONDAY, TUESDAY, etc.
    startTime: string; // "06:00"
    endTime: string; // "18:00"
  }[]
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "WORKER") {
    return { success: false, error: "Only workers can set availability." };
  }

  const workerProfile = await db.workerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!workerProfile) {
    return { success: false, error: "Worker profile not found." };
  }

  // Validate slots
  const validDays = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ];
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

  for (const slot of slots) {
    if (!validDays.includes(slot.dayOfWeek)) {
      return { success: false, error: `Invalid day: ${slot.dayOfWeek}` };
    }
    if (!timeRegex.test(slot.startTime)) {
      return {
        success: false,
        error: `Invalid start time format: ${slot.startTime}`,
      };
    }
    if (!timeRegex.test(slot.endTime)) {
      return {
        success: false,
        error: `Invalid end time format: ${slot.endTime}`,
      };
    }
    if (slot.startTime >= slot.endTime) {
      return {
        success: false,
        error: `Start time must be before end time for ${slot.dayOfWeek}.`,
      };
    }
  }

  // Check for duplicate days
  const daySet = new Set(slots.map((s) => s.dayOfWeek));
  if (daySet.size !== slots.length) {
    return { success: false, error: "Duplicate day entries found." };
  }

  try {
    await db.$transaction(async (tx) => {
      // Delete all existing slots for this worker
      await tx.availabilitySlot.deleteMany({
        where: { workerProfileId: workerProfile.id },
      });

      // Create new slots
      if (slots.length > 0) {
        await tx.availabilitySlot.createMany({
          data: slots.map((slot) => ({
            workerProfileId: workerProfile.id,
            dayOfWeek: slot.dayOfWeek as
              | "MONDAY"
              | "TUESDAY"
              | "WEDNESDAY"
              | "THURSDAY"
              | "FRIDAY"
              | "SATURDAY"
              | "SUNDAY",
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        });
      }
    });

    revalidatePath("/worker/schedule");
    revalidatePath("/worker/shifts");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save availability.";
    return { success: false, error: message };
  }
}

// ─── Block Specific Dates ─────────────────────────────────────────

export async function blockDates(
  dates: { date: string; reason?: string }[]
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "WORKER") {
    return { success: false, error: "Only workers can block dates." };
  }

  const workerProfile = await db.workerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!workerProfile) {
    return { success: false, error: "Worker profile not found." };
  }

  if (!dates || dates.length === 0) {
    return { success: false, error: "No dates provided." };
  }
  if (dates.length > 365) {
    return { success: false, error: "Cannot block more than 365 dates at once." };
  }

  // Validate dates
  for (const d of dates) {
    const parsed = new Date(d.date);
    if (isNaN(parsed.getTime())) {
      return { success: false, error: `Invalid date: ${d.date}` };
    }
  }

  try {
    // Use upsert-like approach: skip duplicates
    for (const d of dates) {
      const dateObj = new Date(d.date + "T00:00:00.000Z");
      await db.blockedDate.upsert({
        where: {
          workerProfileId_date: {
            workerProfileId: workerProfile.id,
            date: dateObj,
          },
        },
        create: {
          workerProfileId: workerProfile.id,
          date: dateObj,
          reason: d.reason || null,
        },
        update: {
          reason: d.reason || null,
        },
      });
    }

    revalidatePath("/worker/schedule");
    revalidatePath("/worker/shifts");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to block dates.";
    return { success: false, error: message };
  }
}

// ─── Unblock a Date ───────────────────────────────────────────────

export async function unblockDate(dateId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "WORKER") {
    return { success: false, error: "Only workers can unblock dates." };
  }

  const workerProfile = await db.workerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!workerProfile) {
    return { success: false, error: "Worker profile not found." };
  }

  // Verify ownership
  const blocked = await db.blockedDate.findUnique({
    where: { id: dateId },
    select: { workerProfileId: true },
  });
  if (!blocked || blocked.workerProfileId !== workerProfile.id) {
    return { success: false, error: "Blocked date not found." };
  }

  try {
    await db.blockedDate.delete({ where: { id: dateId } });
    revalidatePath("/worker/schedule");
    revalidatePath("/worker/shifts");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to unblock date.";
    return { success: false, error: message };
  }
}

// ─── Get Worker's Blocked Dates ───────────────────────────────────

export async function getBlockedDates(): Promise<
  { id: string; date: string; reason: string | null }[]
> {
  const user = await getSessionUser();
  if (user.role !== "WORKER") return [];

  const workerProfile = await db.workerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!workerProfile) return [];

  const blocked = await db.blockedDate.findMany({
    where: { workerProfileId: workerProfile.id },
    orderBy: { date: "asc" },
  });

  return blocked.map((b) => ({
    id: b.id,
    date: b.date.toISOString().split("T")[0],
    reason: b.reason,
  }));
}

// ─── Get Worker's Weekly Availability ─────────────────────────────

export async function getWeeklyAvailability(): Promise<
  { dayOfWeek: string; startTime: string; endTime: string }[]
> {
  const user = await getSessionUser();
  if (user.role !== "WORKER") return [];

  const workerProfile = await db.workerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!workerProfile) return [];

  const slots = await db.availabilitySlot.findMany({
    where: { workerProfileId: workerProfile.id },
    orderBy: { dayOfWeek: "asc" },
  });

  return slots.map((s) => ({
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
  }));
}

// ─── Get Worker's Shifts for Calendar ─────────────────────────────

export async function getWorkerShiftsForCalendar(
  year: number,
  month: number
): Promise<
  {
    id: string;
    role: string;
    startTime: string;
    endTime: string;
    status: string;
    location: string;
    providerName: string;
  }[]
> {
  const user = await getSessionUser();
  if (user.role !== "WORKER") return [];

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  const shifts = await db.shift.findMany({
    where: {
      assignedWorkerId: user.id,
      startTime: { gte: startOfMonth },
      endTime: { lte: endOfMonth },
      status: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] },
    },
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

  return shifts.map((s) => ({
    id: s.id,
    role: s.role,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    status: s.status,
    location: s.location,
    providerName:
      s.provider?.providerProfile?.companyName || s.provider?.name || "Provider",
  }));
}
