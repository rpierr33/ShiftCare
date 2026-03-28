"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { canPostShift, incrementShiftUsage } from "@/lib/subscription";
import { geocodeAddress, haversineDistanceMiles } from "@/lib/geo";
import { captureShiftPayment, cancelShiftWithRefund, confirmShiftCompletion } from "@/lib/stripe-actions";
import { revalidatePath } from "next/cache";
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

// ---- Create Shift (Provider only) ----
// Creates a new open shift. Provider-only. Validates inputs, checks suspension,
// license expiry, provider profile completeness, plan limits, geocodes location,
// and atomically increments usage within a transaction.

interface CreateShiftInput {
  role: WorkerRole;
  title?: string;
  location: string;
  startTime: string;
  endTime: string;
  payRate: number;
  notes?: string;
  minExperience?: number;
  requirements?: string[];
  isUrgent?: boolean;
  payCadence?: "SAME_DAY" | "STANDARD";
  description?: string;
  invitePreferredFirst?: boolean;
}

export async function createShift(input: CreateShiftInput): Promise<ActionResult<{ id: string }>> {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") {
    return { success: false, error: "Only providers can create shifts." };
  }

  // Check suspension
  const userRecord = await db.user.findUnique({ where: { id: user.id } });
  if (userRecord?.isSuspended) {
    return { success: false, error: "Your account is suspended due to reliability issues. Contact support." };
  }

  // Check provider license expiry (agencies only)
  const provProfile = await db.providerProfile.findUnique({ where: { userId: user.id } });
  if (provProfile?.providerType === "AGENCY" && provProfile.licenseExpiryDate) {
    if (provProfile.licenseExpiryDate < new Date()) {
      return { success: false, error: "Your agency license has expired. Renew before posting shifts." };
    }
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

      // Require basic profile completion before posting
      if (!profile.companyName || !profile.companyName.trim()) {
        throw new Error("Complete your company profile before posting shifts. Go to Settings to add your company name.");
      }
      if (profile.providerType === "AGENCY" && !profile.city) {
        throw new Error("Add your business location in Settings before posting shifts.");
      }

      // Check provider verification — block after 90 days unverified (agencies only, not private payers)
      if (profile.providerType !== "PRIVATE" && profile.complianceStatus === "PENDING") {
        const daysSinceSignup = (Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceSignup > 90) {
          throw new Error("Your account verification is overdue. Please contact support to resolve.");
        }
      }

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

      // Geocode the location (non-blocking — shift saves even if geocoding fails)
      const geo = await geocodeAddress(input.location);

      // Create the shift
      const newShift = await tx.shift.create({
        data: {
          providerId: user.id,
          role: input.role,
          title: input.title || null,
          location: input.location,
          latitude: geo?.latitude ?? null,
          longitude: geo?.longitude ?? null,
          startTime,
          endTime,
          payRate: input.payRate,
          notes: input.notes || null,
          status: "OPEN",
          minExperience: input.minExperience || null,
          requirements: input.requirements || [],
          isUrgent: input.isUrgent || false,
          payCadence: input.payCadence || "STANDARD",
          description: input.description || null,
          isPublic: !input.invitePreferredFirst,
          inviteExpiresAt: input.invitePreferredFirst
            ? new Date(Date.now() + 4 * 60 * 60 * 1000) // 4-hour window
            : null,
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

    // Send preferred worker invites if applicable
    if (input.invitePreferredFirst) {
      try {
        const { sendPreferredInvites } = await import("@/actions/invites");
        await sendPreferredInvites(shift.id);
      } catch (e) {
        console.error("Failed to send preferred invites:", e);
      }
    }

    return { success: true, data: { id: shift.id } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create shift.";
    return { success: false, error: message };
  }
}

// ---- Create Recurring Shifts (Provider only) ----
// Creates multiple shifts across different dates with the same time/location/rate.
// Validates all dates, checks plan quota for the entire batch, geocodes once.

interface CreateRecurringShiftsInput {
  role: WorkerRole;
  location: string;
  startTime: string; // "07:00" format
  endTime: string;   // "15:00" format
  payRate: number;
  dates: string[];   // Array of ISO date strings e.g. ["2026-03-28", "2026-03-30"]
  notes?: string;
  requirements?: string[];
  isUrgent?: boolean;
  description?: string;
}

export async function createRecurringShifts(
  input: CreateRecurringShiftsInput
): Promise<ActionResult<{ count: number }>> {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") {
    return { success: false, error: "Only providers can create shifts." };
  }

  if (!input.role || !input.location || !input.startTime || !input.endTime || !input.payRate) {
    return { success: false, error: "Missing required fields." };
  }
  if (input.payRate <= 0) {
    return { success: false, error: "Pay rate must be positive." };
  }
  if (!input.dates || input.dates.length === 0) {
    return { success: false, error: "No dates provided." };
  }
  if (input.dates.length > 90) {
    return { success: false, error: "Cannot create more than 90 shifts at once." };
  }

  // Validate all dates are in the future
  const today = new Date().toISOString().split("T")[0];
  for (const dateStr of input.dates) {
    if (dateStr < today) {
      return { success: false, error: `Cannot create shifts in the past (${dateStr}).` };
    }
  }

  try {
    const count = await db.$transaction(async (tx) => {
      const profile = await tx.providerProfile.findUnique({ where: { userId: user.id } });
      if (!profile) throw new Error("Provider profile not found.");

      // Check provider verification — block after 90 days unverified (agencies only)
      if (profile.providerType !== "PRIVATE" && profile.complianceStatus === "PENDING") {
        const daysSinceSignup = (Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceSignup > 90) {
          throw new Error("Your account verification is overdue. Please contact support to resolve.");
        }
      }

      // Check quota for ALL shifts
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
      const plan = await import("@/lib/subscription").then((m) => m.getProviderPlan(user.id));
      const limits = PLAN_LIMITS[plan];
      const currentUsage = usage?.shiftsPosted ?? 0;
      const needed = input.dates.length;

      if (currentUsage + needed > limits.shiftsPerMonth) {
        const remaining = limits.shiftsPerMonth - currentUsage;
        throw new Error(
          `You can only post ${remaining} more shift${remaining === 1 ? "" : "s"} this month (limit: ${limits.shiftsPerMonth}). You're trying to post ${needed}. Upgrade your plan for more.`
        );
      }

      // Geocode location once (shared across all shifts)
      const geo = await geocodeAddress(input.location);

      // Create a shift for each date
      for (const dateStr of input.dates) {
        const shiftStart = new Date(`${dateStr}T${input.startTime}:00`);
        const shiftEnd = new Date(`${dateStr}T${input.endTime}:00`);

        if (isNaN(shiftStart.getTime()) || isNaN(shiftEnd.getTime())) {
          throw new Error(`Invalid date/time for ${dateStr}.`);
        }

        // Handle overnight shifts: if end time is before start time, add 1 day to end
        if (shiftEnd <= shiftStart) {
          shiftEnd.setDate(shiftEnd.getDate() + 1);
        }

        await tx.shift.create({
          data: {
            providerId: user.id,
            role: input.role,
            location: input.location,
            latitude: geo?.latitude ?? null,
            longitude: geo?.longitude ?? null,
            startTime: shiftStart,
            endTime: shiftEnd,
            payRate: input.payRate,
            notes: input.notes || null,
            status: "OPEN",
            requirements: input.requirements || [],
            isUrgent: input.isUrgent || false,
            description: input.description || null,
          },
        });
      }

      // Increment usage by the number of shifts created
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
          shiftsPosted: needed,
        },
        update: {
          shiftsPosted: { increment: needed },
        },
      });

      return needed;
    });

    return { success: true, data: { count } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create shifts.";
    return { success: false, error: message };
  }
}

// ---- Edit Shift (Provider) ----
// Update fields on an existing shift. Cannot edit completed/cancelled shifts.
// Re-geocodes if location changes. Uses optimistic locking via version increment.

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
    // Re-geocode when location changes
    const geo = await geocodeAddress(input.location.trim());
    if (geo) {
      data.latitude = geo.latitude;
      data.longitude = geo.longitude;
    }
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

  // Increment version for optimistic locking
  data.version = { increment: 1 };

  await db.shift.update({
    where: { id: shiftId },
    data,
  });

  // BUG FIX: Added missing revalidatePath calls after shift mutation
  revalidatePath("/agency/shifts");
  revalidatePath(`/agency/shifts/${shiftId}`);
  revalidatePath("/worker/shifts");

  return { success: true };
}

// ---- Get Provider's Shifts ----
// Returns all shifts owned by the current provider with assignment and time entry details.

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
      timeEntries: {
        select: {
          id: true,
          clockInTime: true,
          clockInStatus: true,
          distanceMiles: true,
          worker: { select: { name: true } },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });
}

// ---- Get Available Shifts (Worker) ----
// Returns OPEN shifts matching the worker's role, filtered by:
// - Availability (weekly slots + blocked dates)
// - Location (state + work areas)
// - Experience requirements
// - Strike visibility reduction (both worker and provider)
// Also attaches provider ratings and distance from worker.

export async function getAvailableShifts(filters?: {
  role?: WorkerRole;
}) {
  const user = await getSessionUser();
  if (user.role !== "WORKER") return [];

  // Get worker's profile to match against provider preferences and location
  const workerProfile = await db.workerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, workerRole: true, yearsExperience: true, city: true, state: true, workAreas: true, serviceRadiusMiles: true },
  });

  // Auto-publish expired private invites
  await db.shift.updateMany({
    where: { isPublic: false, inviteExpiresAt: { lt: new Date() }, status: "OPEN" },
    data: { isPublic: true, inviteExpiresAt: null },
  });

  // Get worker's invited shift IDs (for private invite shifts)
  const invitedNotifs = await db.notification.findMany({
    where: { userId: user.id, type: "SHIFT_INVITATION", read: false },
    select: { data: true },
  });
  const invitedShiftIds = invitedNotifs
    .map((n) => (n.data as { shiftId?: string } | null)?.shiftId)
    .filter(Boolean) as string[];

  const where: Record<string, unknown> = {
    status: "OPEN",
    startTime: { gt: new Date() },
    OR: [
      { isPublic: true },
      ...(invitedShiftIds.length > 0 ? [{ id: { in: invitedShiftIds } }] : []),
    ],
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
          providerProfile: { select: { companyName: true, description: true, city: true, state: true, providerType: true } },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  // Get worker's availability data for filtering
  let blockedSet = new Set<string>();
  let availByDay = new Map<string, { startTime: string; endTime: string }>();
  let hasAvailability = false;

  if (workerProfile?.id) {
    const [blockedDates, availSlots] = await Promise.all([
      db.blockedDate.findMany({
        where: { workerProfileId: workerProfile.id },
        select: { date: true },
      }),
      db.availabilitySlot.findMany({
        where: { workerProfileId: workerProfile.id },
      }),
    ]);

    blockedSet = new Set(blockedDates.map((d) => d.date.toISOString().split("T")[0]));
    availByDay = new Map(availSlots.map((s) => [s.dayOfWeek, { startTime: s.startTime, endTime: s.endTime }]));
    hasAvailability = availSlots.length > 0;
  }

  const DAY_NAMES = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

  // Apply provider preference filters + availability filtering
  const filteredShifts = shifts.filter((shift) => {
    // Availability filter: blocked dates
    const shiftDate = new Date(shift.startTime).toISOString().split("T")[0];
    if (blockedSet.has(shiftDate)) return false;

    // Availability filter: weekly availability (only if worker has set slots)
    if (hasAvailability) {
      const dayOfWeek = DAY_NAMES[new Date(shift.startTime).getDay()];
      const slot = availByDay.get(dayOfWeek);
      if (!slot) return false; // Worker didn't set availability for this day

      // Check time overlap: shift must start within worker's available hours
      const shiftStartHHMM = new Date(shift.startTime).toTimeString().slice(0, 5);
      const shiftEndHHMM = new Date(shift.endTime).toTimeString().slice(0, 5);
      // Worker must be available during at least the shift start time
      if (shiftStartHHMM < slot.startTime || shiftStartHHMM >= slot.endTime) return false;
    }
    // Check minimum experience requirement
    if (shift.minExperience != null && workerProfile?.yearsExperience != null) {
      if (workerProfile.yearsExperience < shift.minExperience) return false;
    }
    // Location filter — opt-in, not mandatory.
    // If worker has no state and no workAreas, show ALL shifts (no location filter).
    // If worker has a state set, filter to that state. If worker also has workAreas
    // (without a large radius), further filter by city within the state.
    const hasState = !!workerProfile?.state;
    const hasWorkAreas = workerProfile?.workAreas && workerProfile.workAreas.length > 0;

    if (hasState || hasWorkAreas) {
      const shiftLoc = shift.location.toLowerCase();

      if (hasState) {
        const stateAbbr = workerProfile!.state!.toLowerCase();
        const stateName = getStateName(workerProfile!.state!).toLowerCase();

        // Must be in the same state
        const inState = shiftLoc.includes(stateAbbr) || shiftLoc.includes(stateName);
        if (!inState) return false;
      }

      // If worker has specific work areas AND no large radius, further filter by city
      const hasRadius = (workerProfile?.serviceRadiusMiles ?? 0) > 0;

      if (hasWorkAreas && !hasRadius) {
        // Extract city names from work areas and check against shift location
        const cityTerms: string[] = [];
        for (const area of workerProfile!.workAreas!) {
          const city = area.split(",")[0].trim().toLowerCase();
          if (city.length >= 3) cityTerms.push(city);
        }
        if (workerProfile?.city) cityTerms.push(workerProfile.city.toLowerCase());

        if (cityTerms.length > 0) {
          const matchesCity = cityTerms.some((term) => shiftLoc.includes(term));
          if (!matchesCity) return false;
        }
      }
      // If radius is set, skip city filtering — show all state shifts
      // (proper distance filtering needs geocoding)
    }
    // else: no location data set on worker profile — show all shifts
    return true;
  });

  // Apply strike visibility reduction for worker
  const workerStrikeCount = await db.strike.count({
    where: { userId: user.id, decayedAt: null },
  });
  const workerMultiplier = workerStrikeCount === 0 ? 1.0 : workerStrikeCount === 1 ? 0.75 : workerStrikeCount === 2 ? 0.5 : 0.0;

  // Also check provider strikes and attach warning flags
  const providerStrikeCounts = await db.strike.groupBy({
    by: ["userId"],
    where: { userId: { in: filteredShifts.map((s) => s.providerId) }, decayedAt: null },
    _count: true,
  });
  const providerStrikeMap = new Map(providerStrikeCounts.map((s) => [s.userId, s._count]));

  // Simple hash for deterministic filtering
  const djb2 = (s: string) => {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
    return Math.abs(h);
  };

  // Filter shifts based on both worker and provider strike visibility
  const visibleShifts = filteredShifts.filter((shift) => {
    // Worker visibility reduction
    if (workerMultiplier < 1.0) {
      const hash = djb2(shift.id + user.id);
      if ((hash % 100) >= workerMultiplier * 100) return false;
    }
    // Provider visibility reduction
    const pStrikes = providerStrikeMap.get(shift.providerId) || 0;
    if (pStrikes > 0) {
      const pMultiplier = pStrikes === 1 ? 0.75 : pStrikes === 2 ? 0.5 : 0.0;
      const hash = djb2(shift.id + user.id + "p");
      if ((hash % 100) >= pMultiplier * 100) return false;
    }
    return true;
  });

  // Attach provider average ratings
  const providerIds = [...new Set(visibleShifts.map((s) => s.providerId))];
  const providerRatings = providerIds.length > 0
    ? await db.rating.groupBy({
        by: ["rateeId"],
        where: { rateeId: { in: providerIds } },
        _avg: { score: true },
        _count: true,
      })
    : [];

  const ratingsMap = new Map(
    providerRatings.map((r) => [r.rateeId, { average: r._avg.score ?? 0, count: r._count }])
  );

  // Geocode worker location for distance calculation
  let workerLat: number | null = null;
  let workerLng: number | null = null;
  if (workerProfile?.city && workerProfile?.state) {
    const geo = await geocodeAddress(`${workerProfile.city}, ${workerProfile.state}`);
    if (geo) {
      workerLat = geo.latitude;
      workerLng = geo.longitude;
    }
  }

  return visibleShifts.map((shift) => ({
    ...shift,
    providerRating: ratingsMap.get(shift.providerId) ?? null,
    providerStrikeWarning: (providerStrikeMap.get(shift.providerId) || 0) > 0,
    isInvite: !shift.isPublic && invitedShiftIds.includes(shift.id),
    distanceFromWorker:
      workerLat != null && workerLng != null && shift.latitude != null && shift.longitude != null
        ? Math.round(haversineDistanceMiles(workerLat, workerLng, shift.latitude, shift.longitude) * 10) / 10
        : null,
  }));
}

// ─── Get Worker Context for Recommendations ─────────────────────

export async function getWorkerRecommendationContext() {
  const user = await getSessionUser();
  if (user.role !== "WORKER") return null;

  const profile = await db.workerProfile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      workerRole: true,
      city: true,
      state: true,
      workAreas: true,
      yearsExperience: true,
      reliabilityScore: true,
    },
  });

  if (!profile) return null;

  // Get completed shift history, availability, and blocked dates in parallel
  const [completedShifts, availabilitySlots, blockedDates] = await Promise.all([
    db.shift.findMany({
      where: { assignedWorkerId: user.id, status: "COMPLETED" },
      select: { providerId: true, payRate: true },
    }),
    db.availabilitySlot.findMany({
      where: { workerProfileId: profile.id },
      select: { dayOfWeek: true, startTime: true, endTime: true },
    }),
    db.blockedDate.findMany({
      where: { workerProfileId: profile.id },
      select: { date: true },
    }),
  ]);

  const completedProviderIds = [...new Set(completedShifts.map(s => s.providerId))];
  const avgPayRate = completedShifts.length > 0
    ? completedShifts.reduce((sum, s) => sum + s.payRate, 0) / completedShifts.length
    : null;

  return {
    workerRole: profile.workerRole,
    city: profile.city,
    state: profile.state,
    workAreas: profile.workAreas,
    yearsExperience: profile.yearsExperience,
    reliabilityScore: profile.reliabilityScore,
    completedProviderIds,
    avgPayRate,
    availabilitySlots: availabilitySlots.map(s => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
    })),
    blockedDates: blockedDates.map(d => d.date.toISOString().split("T")[0]),
  };
}

// ---- Accept Shift (Worker) -- Hard Assignment ----
// Transaction-safe shift acceptance. Only one worker can secure a shift.
// Uses optimistic locking via version field to prevent double-booking.
// Checks: suspension, profile completion, credential status, time overlap,
// duplicate assignment. Captures payment after successful assignment.

export async function acceptShift(shiftId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "WORKER") {
    return { success: false, error: "Only workers can accept shifts." };
  }

  // Check suspension
  const userRecord = await db.user.findUnique({ where: { id: user.id } });
  if (userRecord?.isSuspended) {
    return { success: false, error: "Your account is suspended due to reliability issues. Contact support." };
  }

  const workerProfile = await db.workerProfile.findUnique({
    where: { userId: user.id },
  });
  if (!workerProfile || !workerProfile.profileComplete) {
    return { success: false, error: "Complete your profile first." };
  }
  // Allow VERIFIED or PROVISIONAL (within 14-day window)
  if (workerProfile.credentialStatus === "VERIFIED") {
    // Full access — no restrictions
  } else if (workerProfile.credentialStatus === "PROVISIONAL") {
    // Check 14-day provisional window
    const submittedAt = workerProfile.credentialSubmittedAt;
    if (submittedAt) {
      const daysSinceSubmission = (Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceSubmission > 14) {
        return { success: false, error: "Your provisional access has expired. Please wait for admin verification or contact support." };
      }
    }
  } else {
    return { success: false, error: "Submit your credentials in your Profile to start accepting shifts." };
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
          status: { in: ["ASSIGNED", "IN_PROGRESS"] },
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
          assignedAt: new Date(),
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

    // 6. Capture payment from agency (outside transaction — Stripe API call)
    try {
      await captureShiftPayment(shiftId);
    } catch (paymentError) {
      // Payment capture failed — log but don't fail the assignment
      // The webhook handler for payment_intent.payment_failed will revert if needed
      console.error("Payment capture failed after shift assignment:", paymentError);
    }

    revalidatePath("/worker/shifts");
    revalidatePath("/worker/my-shifts");
    revalidatePath("/agency/dashboard");
    revalidatePath("/agency/shifts");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to accept shift.";
    return { success: false, error: message };
  }
}

const PROVIDER_LATE_CANCEL_FEE = 15.0; // $15 flat fee for late cancellations

// ---- Cancel Shift (Provider) ----
// Cancel a shift and process refund. Records a late-cancel strike if within
// 4 hours of start and a worker was assigned. Suspends provider after 3 strikes.

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

  try {
    await cancelShiftWithRefund(shiftId, "AGENCY");

    // Record late cancellation strike for provider if within 4 hours AND worker was assigned
    if (shift.assignedWorkerId) {
      const hoursUntilStart = (shift.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilStart < 4) {
        try {
          const { sendNotification } = await import("@/lib/notifications");
          await db.strike.create({
            data: { userId: user.id, type: "LATE_CANCEL", shiftId },
          });
          const activeCount = await db.strike.count({
            where: { userId: user.id, decayedAt: null },
          });
          if (activeCount >= 3) {
            await db.user.update({
              where: { id: user.id },
              data: { isSuspended: true, suspendedAt: new Date() },
            });
          }
          await sendNotification({
            userId: user.id,
            type: "LATE_CANCEL_STRIKE",
            title: "Late Cancellation Recorded",
            body: `Cancelling an assigned shift within 4 hours counts as a late cancellation (${activeCount} total). A $${PROVIDER_LATE_CANCEL_FEE.toFixed(2)} fee has been charged. ${activeCount >= 3 ? "Your account has been suspended." : ""}`,
            channels: ["inapp", "push"],
          });

          // Record cancellation fee transaction
          await db.transaction.create({
            data: {
              type: "PLATFORM_FEE",
              status: "COMPLETED",
              amount: PROVIDER_LATE_CANCEL_FEE,
              platformFee: PROVIDER_LATE_CANCEL_FEE,
              netAmount: 0,
              description: `Late cancellation fee — shift cancelled within 4 hours of start`,
              providerId: user.id,
              shiftId,
            },
          });

          // Notify the assigned worker about the cancellation and fee
          await sendNotification({
            userId: shift.assignedWorkerId,
            type: "SHIFT_CANCELLED",
            title: "Shift Cancelled by Employer",
            body: `Your assigned shift has been cancelled by the employer. The employer has been charged a $${PROVIDER_LATE_CANCEL_FEE.toFixed(2)} late cancellation fee.`,
            channels: ["inapp", "push"],
          });
        } catch (e) {
          console.error("Failed to record provider strike:", e);
        }
      }
    }

    revalidatePath("/agency/dashboard");
    revalidatePath("/agency/shifts");
    revalidatePath(`/provider/shifts/${shiftId}`);
    revalidatePath("/worker/my-shifts");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel shift.";
    return { success: false, error: message };
  }
}

// ---- Complete Shift (Provider) ----
// Mark a shift as completed. Delegates to Stripe completion handler for payment processing.

export async function completeShift(shiftId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") {
    return { success: false, error: "Only providers can complete shifts." };
  }

  const shift = await db.shift.findUnique({ where: { id: shiftId } });
  if (!shift || shift.providerId !== user.id) {
    return { success: false, error: "Shift not found." };
  }
  if (shift.status !== "ASSIGNED" && shift.status !== "IN_PROGRESS") {
    return { success: false, error: "Only assigned or in-progress shifts can be completed." };
  }

  try {
    await confirmShiftCompletion(shiftId, user.id);

    revalidatePath("/agency/dashboard");
    revalidatePath("/agency/shifts");
    revalidatePath(`/provider/shifts/${shiftId}`);
    revalidatePath("/worker/my-shifts");
    revalidatePath("/worker/profile");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to complete shift.";
    return { success: false, error: message };
  }
}

// ---- Get Shift Details ----

/**
 * Get full shift details by ID.
 * BUG FIX: Added authentication check -- previously any unauthenticated user
 * could fetch shift details by guessing the ID.
 * Authorization: provider who owns the shift OR the assigned worker can view.
 */
export async function getShiftById(shiftId: string) {
  const user = await getSessionUser();

  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    include: {
      provider: {
        select: {
          name: true,
          providerProfile: { select: { companyName: true, description: true, city: true, state: true, providerType: true } },
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
      timeEntries: {
        select: {
          id: true,
          clockInTime: true,
          clockInStatus: true,
          distanceMiles: true,
          clockOutTime: true,
          clockOutStatus: true,
          clockOutDistanceMiles: true,
          actualHours: true,
          earlyClockOutReason: true,
          worker: { select: { name: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  // Authorization: only the provider who owns the shift or the assigned worker can view details
  if (shift && shift.providerId !== user.id && shift.assignedWorkerId !== user.id) {
    // Workers can also view OPEN shifts (for the marketplace detail page)
    if (user.role !== "WORKER" || shift.status !== "OPEN") {
      return null;
    }
  }

  return shift;
}

// ---- Worker's Accepted Shifts ----
// Returns all shifts assigned to the current worker with provider and time entry details.

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
      timeEntries: {
        where: { workerId: user.id },
        select: {
          id: true,
          clockInTime: true,
          clockInStatus: true,
          distanceMiles: true,
          clockOutTime: true,
          actualHours: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
  });
}

// ---- Cancel Shift (Worker) ----
// Worker cancels their assigned shift. Records a late-cancel strike if within
// 4 hours of start. Suspends worker after 3 strikes.

export async function workerCancelShift(shiftId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "WORKER") {
    return { success: false, error: "Only workers can cancel their shifts." };
  }

  const shift = await db.shift.findUnique({ where: { id: shiftId } });
  if (!shift) {
    return { success: false, error: "Shift not found." };
  }
  if (shift.assignedWorkerId !== user.id) {
    return { success: false, error: "You are not assigned to this shift." };
  }
  if (shift.status !== "ASSIGNED" && shift.status !== "IN_PROGRESS") {
    return { success: false, error: "This shift cannot be cancelled." };
  }

  try {
    await cancelShiftWithRefund(shiftId, "WORKER");

    // Record late cancellation strike if within 4 hours of shift start
    const hoursUntilStart = (shift.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilStart < 4) {
      try {
        const { sendNotification } = await import("@/lib/notifications");
        await db.strike.create({
          data: { userId: user.id, type: "LATE_CANCEL", shiftId },
        });
        const activeCount = await db.strike.count({
          where: { userId: user.id, decayedAt: null },
        });
        if (activeCount >= 3) {
          await db.user.update({
            where: { id: user.id },
            data: { isSuspended: true, suspendedAt: new Date() },
          });
        }
        await sendNotification({
          userId: user.id,
          type: "LATE_CANCEL_STRIKE",
          title: "Late Cancellation Recorded",
          body: `Cancelling within 4 hours of shift start counts as a late cancellation (${activeCount} total). ${activeCount >= 3 ? "Your account has been suspended." : `${3 - activeCount} more will result in suspension.`}`,
          channels: ["inapp", "push"],
        });
      } catch (e) {
        console.error("Failed to record strike:", e);
      }
    }

    revalidatePath("/worker/my-shifts");
    revalidatePath("/worker/shifts");
    revalidatePath("/agency/dashboard");
    revalidatePath("/agency/shifts");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel shift.";
    return { success: false, error: message };
  }
}
