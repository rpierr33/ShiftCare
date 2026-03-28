import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";
import { format } from "date-fns";

export async function matchWorkersToShift(shiftId: string) {
  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    include: { provider: { include: { providerProfile: true } } },
  });

  if (!shift || shift.status !== "OPEN") return;

  const matchedWorkers = await db.workerProfile.findMany({
    where: {
      workerRole: shift.role,
      credentialStatus: "VERIFIED",
      stripeAccountStatus: "ACTIVE",
      isAvailable: true,
      user: {
        isActive: true,
        assignedShifts: {
          none: {
            status: "ASSIGNED",
            startTime: { lt: shift.endTime },
            endTime: { gt: shift.startTime },
          },
        },
      },
    },
    include: { user: true },
  });

  // Get ratings for all matched workers to sort by rating (higher-rated first)
  const workerUserIds = matchedWorkers.map((w) => w.user.id);
  const ratingsRaw = workerUserIds.length > 0
    ? await db.rating.groupBy({
        by: ["rateeId"],
        where: { rateeId: { in: workerUserIds } },
        _avg: { score: true },
        _count: true,
      })
    : [];
  const ratingsMap = new Map(
    ratingsRaw.map((r) => [r.rateeId, r._avg.score ?? 0])
  );

  // Sort by rating descending — higher-rated workers get notified first
  const sortedWorkers = [...matchedWorkers].sort((a, b) => {
    const ratingA = ratingsMap.get(a.user.id) ?? 0;
    const ratingB = ratingsMap.get(b.user.id) ?? 0;
    return ratingB - ratingA;
  });

  for (const worker of sortedWorkers) {
    // Check geo filter: worker's city/ZIP within shift's service area
    const workerCities = [
      worker.city?.toLowerCase(),
      ...worker.workAreas.map((a) => a.split(",")[0].trim().toLowerCase()),
    ].filter(Boolean);

    const shiftCity = shift.location.toLowerCase();
    const cityMatch =
      workerCities.length === 0 ||
      workerCities.some((c) => c && shiftCity.includes(c));

    if (!cityMatch) continue;

    await sendNotification({
      userId: worker.user.id,
      type: "SHIFT_MATCH",
      title: `New ${shift.role} shift in ${shift.location.split(",")[0]}`,
      body: `$${shift.payRate}/hr - ${format(shift.startTime, "MMM d")} - ${shift.provider.providerProfile?.companyName || shift.provider.name}. Accept before it's gone.`,
      channels: ["inapp", "sms"],
    });
  }
}

export function getShiftSortScore(
  shift: { isUrgent: boolean; role: string; createdAt: Date; location: string },
  workerRole?: string | null,
  workerCity?: string | null,
  workerRating?: number | null
): number {
  let score = 0;

  // 1. Urgent first
  if (shift.isUrgent) score += 10000;

  // 2. Credential match (worker's role === shift role)
  if (workerRole && shift.role === workerRole) score += 1000;

  // 3. Rating boost — higher-rated workers see better shifts first
  if (workerRating != null) {
    if (workerRating >= 4.5) score += 500;
    else if (workerRating >= 4.0) score += 200;
  }

  // 4. Distance (nearest first, based on city match)
  if (workerCity && shift.location.toLowerCase().includes(workerCity.toLowerCase())) {
    score += 100;
  }

  // 5. Posted time (newest first)
  score += (Date.now() - shift.createdAt.getTime()) / -3600000; // negative hours ago

  return score;
}

// ─── Shift Recommendation Scoring ────────────────────────────────
// Scores each shift for a specific worker based on multiple signals.
// Returns top N shifts sorted by recommendation score.

interface ShiftForScoring {
  id: string;
  role: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  payRate: number;
  startTime: Date;
  endTime: Date;
  isUrgent: boolean;
  payCadence: string;
  providerId: string;
  createdAt: Date;
}

interface WorkerContext {
  workerRole: string | null;
  city: string | null;
  state: string | null;
  workAreas: string[];
  latitude?: number | null;
  longitude?: number | null;
  yearsExperience: number | null;
  reliabilityScore: number | null;
  // History
  completedProviderIds: string[]; // providers this worker has worked with before
  avgPayRate: number | null;      // worker's average pay from completed shifts
  // Availability
  availabilitySlots?: { dayOfWeek: string; startTime: string; endTime: string }[];
  blockedDates?: string[]; // ISO date strings "YYYY-MM-DD"
}

export function scoreShiftForWorker(
  shift: ShiftForScoring,
  worker: WorkerContext
): number {
  let score = 0;

  // 0. Availability check — penalize heavily if shift conflicts with worker's schedule
  if (worker.blockedDates && worker.blockedDates.length > 0) {
    const shiftDate = shift.startTime.toISOString().split("T")[0];
    if (worker.blockedDates.includes(shiftDate)) {
      return -1000; // Blocked date — should not be recommended
    }
  }

  if (worker.availabilitySlots && worker.availabilitySlots.length > 0) {
    const DAY_NAMES = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const dayOfWeek = DAY_NAMES[shift.startTime.getDay()];
    const slot = worker.availabilitySlots.find(s => s.dayOfWeek === dayOfWeek);
    if (!slot) {
      score -= 500; // Worker not available this day — strong demotion
    } else {
      const shiftStartHHMM = shift.startTime.toTimeString().slice(0, 5);
      if (shiftStartHHMM < slot.startTime || shiftStartHHMM >= slot.endTime) {
        score -= 300; // Outside worker's available hours — moderate demotion
      } else {
        score += 50; // Shift fits worker's availability perfectly — bonus
      }
    }
  }

  // 1. Role match (critical — 300 points)
  if (worker.workerRole && shift.role === worker.workerRole) {
    score += 300;
  }

  // 2. Location proximity (0-200 points)
  if (worker.city) {
    const shiftLoc = shift.location.toLowerCase();
    const workerCity = worker.city.toLowerCase();
    if (shiftLoc.includes(workerCity)) {
      score += 200; // Same city
    } else if (worker.workAreas.some(a => shiftLoc.includes(a.split(",")[0].trim().toLowerCase()))) {
      score += 150; // In work areas
    } else if (worker.state && shiftLoc.includes(worker.state.toLowerCase())) {
      score += 50; // Same state
    }
  }

  // 3. Pay rate (0-150 points) — higher relative to worker's average = better
  if (worker.avgPayRate && worker.avgPayRate > 0) {
    const payRatio = shift.payRate / worker.avgPayRate;
    if (payRatio >= 1.2) score += 150;      // 20%+ above average
    else if (payRatio >= 1.0) score += 100;  // At or above average
    else if (payRatio >= 0.85) score += 50;  // Within 15% below
    // Below 85% of avg = no bonus
  } else {
    score += 75; // No history, neutral
  }

  // 4. Same-day pay bonus (50 points) — workers prefer instant payment
  if (shift.payCadence === "SAME_DAY") {
    score += 50;
  }

  // 5. Urgency (100 points) — filling fast, act now
  if (shift.isUrgent) {
    score += 100;
  }

  // 6. Time proximity (0-100 points) — shifts starting soon get priority
  const hoursUntilStart = (shift.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntilStart > 0 && hoursUntilStart <= 12) score += 100;
  else if (hoursUntilStart <= 24) score += 75;
  else if (hoursUntilStart <= 48) score += 50;
  else if (hoursUntilStart <= 72) score += 25;

  // 7. Familiar provider (75 points) — worked with before = trust/preference
  if (worker.completedProviderIds.includes(shift.providerId)) {
    score += 75;
  }

  // 8. Freshness (0-50 points) — recently posted shifts are more relevant
  const hoursAgo = (Date.now() - shift.createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursAgo <= 1) score += 50;
  else if (hoursAgo <= 4) score += 35;
  else if (hoursAgo <= 12) score += 20;

  return score;
}

export function getTopPicks<T extends ShiftForScoring>(
  shifts: T[],
  worker: WorkerContext,
  maxPicks: number = 5
): (T & { matchScore: number })[] {
  return shifts
    .map((shift) => ({
      ...shift,
      matchScore: scoreShiftForWorker(shift, worker),
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, maxPicks);
}
