import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";
import { format } from "date-fns";

// Finds all eligible workers for a shift and notifies them via in-app + SMS
// Eligibility: matching role, verified credentials, active Stripe, available, no conflicting shifts
export async function matchWorkersToShift(shiftId: string) {
  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    include: { provider: { include: { providerProfile: true } } },
  });

  // Only match for OPEN shifts
  if (!shift || shift.status !== "OPEN") return;

  // Query workers who match the shift's role and are eligible
  const matchedWorkers = await db.workerProfile.findMany({
    where: {
      workerRole: shift.role,
      credentialStatus: "VERIFIED",
      stripeAccountStatus: "ACTIVE",
      isAvailable: true,
      user: {
        isActive: true,
        // Exclude workers who already have an assigned shift overlapping this one's time window
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

  // Fetch average ratings for all matched workers to sort by quality
  const workerUserIds = matchedWorkers.map((w) => w.user.id);
  const ratingsRaw = workerUserIds.length > 0
    ? await db.rating.groupBy({
        by: ["rateeId"],
        where: { rateeId: { in: workerUserIds } },
        _avg: { score: true },
        _count: true,
      })
    : [];
  // Map userId to average rating score
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
    // Build list of cities the worker serves (from profile city + work areas)
    const workerCities = [
      worker.city?.toLowerCase(),
      ...worker.workAreas.map((a) => a.split(",")[0].trim().toLowerCase()),
    ].filter(Boolean);

    const shiftCity = shift.location.toLowerCase();
    // If worker has no city preferences, match all; otherwise check city overlap
    const cityMatch =
      workerCities.length === 0 ||
      workerCities.some((c) => c && shiftCity.includes(c));

    if (!cityMatch) continue;

    // BUG FIX: parseFloat on shift.payRate since Prisma Decimal columns return objects/strings
    const payRateDisplay = parseFloat(String(shift.payRate));

    // Notify matched worker about the available shift
    await sendNotification({
      userId: worker.user.id,
      type: "SHIFT_MATCH",
      title: `New ${shift.role} shift in ${shift.location.split(",")[0]}`,
      body: `$${payRateDisplay}/hr - ${format(shift.startTime, "MMM d")} - ${shift.provider.providerProfile?.companyName || shift.provider.name}. Accept before it's gone.`,
      channels: ["inapp", "sms"],
    });
  }
}

// Calculates a sort score for a shift relative to a worker for marketplace display ordering
// Higher score = more relevant/urgent shift for the worker
export function getShiftSortScore(
  shift: { isUrgent: boolean; role: string; createdAt: Date; location: string },
  workerRole?: string | null,
  workerCity?: string | null,
  workerRating?: number | null
): number {
  let score = 0;

  // Urgent shifts always surface first (highest weight)
  if (shift.isUrgent) score += 10000;

  // Role match between worker's credential and shift's required role
  if (workerRole && shift.role === workerRole) score += 1000;

  // Rating-based boost — reward higher-rated workers with better shift visibility
  if (workerRating != null) {
    if (workerRating >= 4.5) score += 500;
    else if (workerRating >= 4.0) score += 200;
  }

  // City proximity — simple text-based check (not geo distance)
  if (workerCity && shift.location.toLowerCase().includes(workerCity.toLowerCase())) {
    score += 100;
  }

  // Freshness penalty — newer shifts rank higher (negative hours ago)
  score += (Date.now() - shift.createdAt.getTime()) / -3600000;

  return score;
}

// ─── Shift Recommendation Scoring ────────────────────────────────
// Scores each shift for a specific worker based on multiple signals.
// Used by the recommendation engine to surface the most relevant shifts.

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
  // Providers this worker has previously completed shifts with
  completedProviderIds: string[];
  // Worker's historical average pay rate for relative pay comparison
  avgPayRate: number | null;
  // Worker's weekly availability slots
  availabilitySlots?: { dayOfWeek: string; startTime: string; endTime: string }[];
  // Dates the worker has blocked off (ISO "YYYY-MM-DD" strings)
  blockedDates?: string[];
}

// Scores a single shift for a specific worker — higher = better match
export function scoreShiftForWorker(
  shift: ShiftForScoring,
  worker: WorkerContext
): number {
  let score = 0;

  // 0. Availability check — penalize heavily if shift falls on a blocked date
  if (worker.blockedDates && worker.blockedDates.length > 0) {
    const shiftDate = shift.startTime.toISOString().split("T")[0];
    if (worker.blockedDates.includes(shiftDate)) {
      return -1000; // Hard block — should never be recommended
    }
  }

  // Check if shift falls within worker's weekly availability slots
  if (worker.availabilitySlots && worker.availabilitySlots.length > 0) {
    const DAY_NAMES = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const dayOfWeek = DAY_NAMES[shift.startTime.getDay()];
    const slot = worker.availabilitySlots.find(s => s.dayOfWeek === dayOfWeek);
    if (!slot) {
      score -= 500; // Worker not available this day — strong demotion
    } else {
      // Compare shift start time against worker's available window
      const shiftStartHHMM = shift.startTime.toTimeString().slice(0, 5);
      if (shiftStartHHMM < slot.startTime || shiftStartHHMM >= slot.endTime) {
        score -= 300; // Outside worker's available hours — moderate demotion
      } else {
        score += 50; // Perfect availability fit — bonus
      }
    }
  }

  // 1. Role match (critical signal — 300 points)
  if (worker.workerRole && shift.role === worker.workerRole) {
    score += 300;
  }

  // 2. Location proximity (0-200 points based on match quality)
  if (worker.city) {
    const shiftLoc = shift.location.toLowerCase();
    const workerCity = worker.city.toLowerCase();
    if (shiftLoc.includes(workerCity)) {
      score += 200; // Same city — best match
    } else if (worker.workAreas.some(a => shiftLoc.includes(a.split(",")[0].trim().toLowerCase()))) {
      score += 150; // In one of worker's listed work areas
    } else if (worker.state && shiftLoc.includes(worker.state.toLowerCase())) {
      score += 50; // Same state but different city
    }
  }

  // 3. Pay rate relative to worker's average (0-150 points)
  if (worker.avgPayRate && worker.avgPayRate > 0) {
    const payRatio = shift.payRate / worker.avgPayRate;
    if (payRatio >= 1.2) score += 150;      // 20%+ above average — strong incentive
    else if (payRatio >= 1.0) score += 100;  // At or above average
    else if (payRatio >= 0.85) score += 50;  // Within 15% below — still acceptable
    // Below 85% of avg = no bonus (discourages low-pay shifts)
  } else {
    score += 75; // No history — neutral score
  }

  // 4. Same-day pay bonus — workers prefer instant payment
  if (shift.payCadence === "SAME_DAY") {
    score += 50;
  }

  // 5. Urgency boost — filling fast, act now
  if (shift.isUrgent) {
    score += 100;
  }

  // 6. Time proximity — shifts starting soon get priority (urgency signal)
  const hoursUntilStart = (shift.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntilStart > 0 && hoursUntilStart <= 12) score += 100;
  else if (hoursUntilStart <= 24) score += 75;
  else if (hoursUntilStart <= 48) score += 50;
  else if (hoursUntilStart <= 72) score += 25;

  // 7. Familiar provider — working with someone you know builds trust
  if (worker.completedProviderIds.includes(shift.providerId)) {
    score += 75;
  }

  // 8. Freshness — recently posted shifts are more relevant
  const hoursAgo = (Date.now() - shift.createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursAgo <= 1) score += 50;
  else if (hoursAgo <= 4) score += 35;
  else if (hoursAgo <= 12) score += 20;

  return score;
}

// Returns the top N shifts for a worker, scored and sorted by recommendation relevance
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
