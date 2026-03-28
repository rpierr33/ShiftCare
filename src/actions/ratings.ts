"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

/**
 * Input for rating a completed shift.
 * Workers rate providers on: communication, workEnvironment, paymentReliability, fairness.
 * Providers rate workers on: punctuality, professionalism, skillCompetence.
 */
interface RatingInput {
  shiftId: string;
  score: number;
  comment?: string;
  // Worker sub-metrics (provider rates worker)
  punctuality?: number;
  professionalism?: number;
  skillCompetence?: number;
  // Provider sub-metrics (worker rates provider)
  communication?: number;
  workEnvironment?: number;
  paymentReliability?: number;
  fairness?: number;
}

/** Validate a sub-metric value is an integer between 1 and 5, or undefined (not provided). */
function validateSubMetric(val: number | undefined): boolean {
  if (val === undefined) return true;
  return Number.isInteger(val) && val >= 1 && val <= 5;
}

// Submit a rating for a completed shift
export async function submitRating(input: RatingInput): Promise<ActionResult>;
export async function submitRating(shiftId: string, score: number, comment?: string): Promise<ActionResult>;
export async function submitRating(
  inputOrShiftId: RatingInput | string,
  scoreArg?: number,
  commentArg?: string
): Promise<ActionResult> {
  // Handle both old and new call signatures for backwards compatibility
  let input: RatingInput;
  if (typeof inputOrShiftId === "string") {
    input = { shiftId: inputOrShiftId, score: scoreArg!, comment: commentArg };
  } else {
    input = inputOrShiftId;
  }

  const user = await getSessionUser();

  if (!Number.isInteger(input.score) || input.score < 1 || input.score > 5) {
    return { success: false, error: "Rating must be 1-5 stars." };
  }

  // Validate sub-metrics
  const subMetrics = [
    input.punctuality, input.professionalism, input.skillCompetence,
    input.communication, input.workEnvironment, input.paymentReliability, input.fairness,
  ];
  for (const m of subMetrics) {
    if (!validateSubMetric(m)) {
      return { success: false, error: "All metric ratings must be 1-5 stars." };
    }
  }

  const shift = await db.shift.findUnique({ where: { id: input.shiftId } });
  if (!shift || shift.status !== "COMPLETED") {
    return { success: false, error: "Can only rate completed shifts." };
  }

  // Determine who is being rated
  let rateeId: string;
  let computedScore = input.score;

  if (user.role === "WORKER") {
    if (shift.assignedWorkerId !== user.id) {
      return { success: false, error: "You weren't assigned to this shift." };
    }
    rateeId = shift.providerId; // Worker rates the employer

    // Auto-compute overall from provider sub-metrics if provided
    if (input.communication && input.workEnvironment && input.paymentReliability && input.fairness) {
      computedScore = Math.round(
        (input.communication + input.workEnvironment + input.paymentReliability + input.fairness) / 4
      );
    }
  } else {
    if (shift.providerId !== user.id) {
      return { success: false, error: "This isn't your shift." };
    }
    if (!shift.assignedWorkerId) {
      return { success: false, error: "No worker to rate." };
    }
    rateeId = shift.assignedWorkerId; // Employer rates the worker

    // Auto-compute overall from worker sub-metrics if provided (weighted)
    if (input.punctuality && input.professionalism && input.skillCompetence) {
      computedScore = Math.round(
        input.punctuality * 0.3 + input.professionalism * 0.3 + input.skillCompetence * 0.4
      );
    }
  }

  // Clamp
  computedScore = Math.max(1, Math.min(5, computedScore));

  // Check for existing rating
  const existing = await db.rating.findUnique({
    where: { shiftId_raterId: { shiftId: input.shiftId, raterId: user.id } },
  });
  if (existing) {
    return { success: false, error: "You've already rated this shift." };
  }

  await db.rating.create({
    data: {
      shiftId: input.shiftId,
      raterId: user.id,
      rateeId,
      score: computedScore,
      comment: input.comment?.trim() || null,
      // Worker sub-metrics
      punctuality: input.punctuality ?? null,
      professionalism: input.professionalism ?? null,
      skillCompetence: input.skillCompetence ?? null,
      // Provider sub-metrics
      communication: input.communication ?? null,
      workEnvironment: input.workEnvironment ?? null,
      paymentReliability: input.paymentReliability ?? null,
      fairness: input.fairness ?? null,
    },
  });

  revalidatePath("/worker/my-shifts");
  revalidatePath("/agency/shifts");
  revalidatePath(`/agency/shifts/${input.shiftId}`);
  return { success: true };
}

/** Get the simple average rating and count for a user (backwards compatible). */
export async function getUserAverageRating(
  userId: string
): Promise<{ average: number; count: number }> {
  const result = await db.rating.aggregate({
    where: { rateeId: userId },
    _avg: { score: true },
    _count: true,
  });
  return {
    average: result._avg.score ?? 0,
    count: result._count,
  };
}

/** Get detailed rating breakdown with sub-metrics (worker and provider metrics). */
export async function getUserDetailedRatings(userId: string): Promise<{
  overall: { average: number; count: number };
  // Worker metrics
  punctuality?: { average: number; count: number };
  professionalism?: { average: number; count: number };
  skillCompetence?: { average: number; count: number };
  reliability?: number;
  // Provider metrics
  communication?: { average: number; count: number };
  workEnvironment?: { average: number; count: number };
  paymentReliability?: { average: number; count: number };
  fairness?: { average: number; count: number };
}> {
  const result = await db.rating.aggregate({
    where: { rateeId: userId },
    _avg: {
      score: true,
      punctuality: true,
      professionalism: true,
      skillCompetence: true,
      communication: true,
      workEnvironment: true,
      paymentReliability: true,
      fairness: true,
    },
    _count: true,
  });

  // Count non-null sub-metrics separately
  const workerMetricCount = await db.rating.count({
    where: { rateeId: userId, punctuality: { not: null } },
  });
  const providerMetricCount = await db.rating.count({
    where: { rateeId: userId, communication: { not: null } },
  });

  const detailed: {
    overall: { average: number; count: number };
    punctuality?: { average: number; count: number };
    professionalism?: { average: number; count: number };
    skillCompetence?: { average: number; count: number };
    reliability?: number;
    communication?: { average: number; count: number };
    workEnvironment?: { average: number; count: number };
    paymentReliability?: { average: number; count: number };
    fairness?: { average: number; count: number };
  } = {
    overall: { average: result._avg.score ?? 0, count: result._count },
  };

  // Worker metrics (if user has been rated as a worker)
  if (workerMetricCount > 0) {
    detailed.punctuality = { average: result._avg.punctuality ?? 0, count: workerMetricCount };
    detailed.professionalism = { average: result._avg.professionalism ?? 0, count: workerMetricCount };
    detailed.skillCompetence = { average: result._avg.skillCompetence ?? 0, count: workerMetricCount };

    // Get reliability from worker profile
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { workerProfile: { select: { reliabilityScore: true } } },
    });
    detailed.reliability = user?.workerProfile?.reliabilityScore ?? undefined;
  }

  // Provider metrics (if user has been rated as a provider)
  if (providerMetricCount > 0) {
    detailed.communication = { average: result._avg.communication ?? 0, count: providerMetricCount };
    detailed.workEnvironment = { average: result._avg.workEnvironment ?? 0, count: providerMetricCount };
    detailed.paymentReliability = { average: result._avg.paymentReliability ?? 0, count: providerMetricCount };
    detailed.fairness = { average: result._avg.fairness ?? 0, count: providerMetricCount };
  }

  return detailed;
}

/** Get average ratings for multiple users in a single query (batch). */
export async function getBatchAverageRatings(
  userIds: string[]
): Promise<Map<string, { average: number; count: number }>> {
  if (userIds.length === 0) return new Map();

  const ratings = await db.rating.groupBy({
    by: ["rateeId"],
    where: { rateeId: { in: userIds } },
    _avg: { score: true },
    _count: true,
  });

  const map = new Map<string, { average: number; count: number }>();
  for (const r of ratings) {
    map.set(r.rateeId, {
      average: r._avg.score ?? 0,
      count: r._count,
    });
  }
  return map;
}

/** Check if the current user has already rated a specific shift. */
export async function hasRatedShift(shiftId: string): Promise<boolean> {
  const user = await getSessionUser();
  const existing = await db.rating.findUnique({
    where: { shiftId_raterId: { shiftId, raterId: user.id } },
  });
  return !!existing;
}
