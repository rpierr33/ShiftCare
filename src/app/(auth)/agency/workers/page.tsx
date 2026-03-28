export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Users,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { InviteWorkerButton } from "./invite-worker-button";
import { StarDisplay } from "@/components/shared/star-display";
import { PreferredToggle } from "./preferred-toggle";
import { WorkerFilters } from "./worker-filters";
import { WorkerRatingDetail } from "./worker-rating-detail";
import { getUserDetailedRatings } from "@/actions/ratings";

const ROLE_SHORT: Record<string, string> = {
  RN: "RN",
  LPN: "LPN",
  CNA: "CNA",
  HHA: "HHA",
  MEDICAL_ASSISTANT: "MA",
  COMPANION: "COMP",
  OTHER: "OTH",
};

const ROLE_BADGE_COLOR: Record<string, string> = {
  RN: "bg-purple-100 text-purple-700",
  LPN: "bg-indigo-100 text-indigo-700",
  CNA: "bg-teal-100 text-teal-700",
  HHA: "bg-orange-100 text-orange-700",
  MEDICAL_ASSISTANT: "bg-cyan-100 text-cyan-700",
  COMPANION: "bg-pink-100 text-pink-700",
  OTHER: "bg-gray-100 text-gray-700",
};

function getReliabilityColor(score: number): string {
  if (score >= 90) return "text-emerald-600 bg-emerald-50";
  if (score >= 75) return "text-amber-600 bg-amber-50";
  return "text-red-600 bg-red-50";
}

export default async function AgencyWorkersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; reliability?: string; rating?: string }>;
}) {
  const params = await searchParams;
  const filterSearch = (params.search ?? "").toLowerCase().trim();
  const filterRole = params.role ?? "";
  const filterReliability = params.reliability ?? "";
  const filterRating = params.rating ?? "";

  const user = await getSessionUser();

  // Find workers who have completed at least 1 shift with this agency
  const completedAssignments = await db.assignment.findMany({
    where: {
      status: { in: ["CONFIRMED", "ACCEPTED"] },
      shift: {
        providerId: user.id,
        status: { in: ["COMPLETED", "ASSIGNED"] },
      },
    },
    include: {
      workerProfile: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      shift: {
        select: { startTime: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Aggregate by worker
  const workerMap = new Map<string, {
    userId: string;
    name: string;
    role: string | null;
    totalShifts: number;
    completedShifts: number;
    lastShiftDate: Date;
    reliabilityScore: number | null;
    workerProfileId: string;
  }>();

  for (const assignment of completedAssignments) {
    const wp = assignment.workerProfile;
    const existing = workerMap.get(wp.userId);
    const isCompleted = assignment.shift.status === "COMPLETED";

    if (existing) {
      existing.totalShifts += 1;
      if (isCompleted) existing.completedShifts += 1;
      if (assignment.shift.startTime > existing.lastShiftDate) {
        existing.lastShiftDate = assignment.shift.startTime;
      }
    } else {
      workerMap.set(wp.userId, {
        userId: wp.userId,
        name: wp.user.name,
        role: wp.workerRole,
        totalShifts: 1,
        completedShifts: isCompleted ? 1 : 0,
        lastShiftDate: assignment.shift.startTime,
        reliabilityScore: wp.reliabilityScore,
        workerProfileId: wp.id,
      });
    }
  }

  const workers = Array.from(workerMap.values()).sort(
    (a, b) => b.lastShiftDate.getTime() - a.lastShiftDate.getTime()
  );

  // Get average ratings for all workers displayed
  const workerUserIds = workers.map((w) => w.userId);
  const workerRatingsRaw = workerUserIds.length > 0
    ? await db.rating.groupBy({
        by: ["rateeId"],
        where: { rateeId: { in: workerUserIds } },
        _avg: { score: true },
        _count: true,
      })
    : [];
  const workerRatingsMap = new Map(
    workerRatingsRaw.map((r) => [r.rateeId, { average: r._avg.score ?? 0, count: r._count }])
  );

  // Fetch detailed ratings (sub-metrics) for all workers with ratings
  const workersWithRatings = workerUserIds.filter((id) => workerRatingsMap.has(id));
  const detailedRatingsEntries = await Promise.all(
    workersWithRatings.map(async (userId) => {
      const detailed = await getUserDetailedRatings(userId);
      return [userId, detailed] as const;
    })
  );
  const detailedRatingsMap = new Map(detailedRatingsEntries);

  // Apply filters
  const filteredWorkers = workers.filter((worker) => {
    // Name search
    if (filterSearch && !worker.name.toLowerCase().includes(filterSearch)) return false;

    // Role filter
    if (filterRole && worker.role !== filterRole) return false;

    // Reliability filter
    const score = worker.reliabilityScore ?? (worker.totalShifts > 0
      ? Math.round((worker.completedShifts / worker.totalShifts) * 100)
      : 0);
    if (filterReliability === "90" && score < 90) return false;
    if (filterReliability === "75" && score < 75) return false;
    if (filterReliability === "under75" && score >= 75) return false;

    // Rating filter
    const ratingData = workerRatingsMap.get(worker.userId);
    const avgRating = ratingData?.average ?? 0;
    if (filterRating === "4" && avgRating < 4) return false;
    if (filterRating === "3" && avgRating < 3) return false;
    if (filterRating === "under3" && avgRating >= 3) return false;

    return true;
  });

  // Get open shifts for invite modal
  const openShifts = await db.shift.findMany({
    where: { providerId: user.id, status: "OPEN" },
    select: { id: true, role: true, startTime: true, location: true, payRate: true },
    orderBy: { startTime: "asc" },
  });

  // Get preferred worker IDs for this provider
  const preferredWorkers = await db.preferredWorker.findMany({
    where: { providerId: user.id },
    select: { workerId: true },
  });
  const preferredWorkerIds = new Set(preferredWorkers.map((pw) => pw.workerId));

  const openShiftsSerialized = openShifts.map((s) => ({
    id: s.id,
    role: s.role,
    startTime: s.startTime.toISOString(),
    location: s.location,
    payRate: s.payRate,
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Workers</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Workers who have completed shifts with your organization.
        </p>
      </div>

      {workers.length > 0 && <WorkerFilters />}

      {filteredWorkers.length === 0 && workers.length > 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No workers match your filters</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      ) : workers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No workers yet</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Post your first shift -- workers who complete it will appear here.
          </p>
          <Link
            href="/agency/shifts/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors text-sm"
          >
            Post a Shift
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr,auto,auto,auto,auto,auto,auto] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wide">
            <span>Worker</span>
            <span>Role</span>
            <span>Last Shift</span>
            <span>Total Shifts</span>
            <span>Reliability</span>
            <span>Preferred</span>
            <span></span>
          </div>

          <div className="divide-y divide-slate-50">
            {filteredWorkers.map((worker) => {
              const score = worker.reliabilityScore ?? (worker.totalShifts > 0
                ? Math.round((worker.completedShifts / worker.totalShifts) * 100)
                : 0);

              return (
                <div
                  key={worker.userId}
                  className="grid grid-cols-1 sm:grid-cols-[1fr,auto,auto,auto,auto,auto,auto] gap-3 sm:gap-4 items-center px-6 py-4 hover:bg-slate-50/50 transition-colors"
                >
                  {/* Name */}
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-cyan-700">
                        {worker.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">{worker.name}</p>
                      {workerRatingsMap.has(worker.userId) && (
                        <StarDisplay
                          average={workerRatingsMap.get(worker.userId)!.average}
                          count={workerRatingsMap.get(worker.userId)!.count}
                        />
                      )}
                    </div>
                  </div>

                  {/* Role */}
                  {worker.role ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${ROLE_BADGE_COLOR[worker.role] ?? "bg-gray-100 text-gray-700"}`}>
                      {ROLE_SHORT[worker.role] ?? worker.role}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">--</span>
                  )}

                  {/* Last shift */}
                  <span className="text-xs text-slate-600">
                    {new Date(worker.lastShiftDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>

                  {/* Total shifts */}
                  <span className="text-xs font-medium text-slate-900 text-center">
                    {worker.totalShifts}
                  </span>

                  {/* Reliability */}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getReliabilityColor(score)}`}>
                    {score}%
                  </span>

                  {/* Preferred toggle */}
                  <div className="flex justify-center">
                    <PreferredToggle
                      workerId={worker.userId}
                      initialPreferred={preferredWorkerIds.has(worker.userId)}
                    />
                  </div>

                  {/* Invite button */}
                  <InviteWorkerButton
                    workerId={worker.userId}
                    workerName={worker.name}
                    openShifts={openShiftsSerialized}
                  />

                  {/* Rating breakdown expandable */}
                  {(() => {
                    const detailed = detailedRatingsMap.get(worker.userId);
                    if (!detailed || detailed.overall.count === 0) return null;

                    const metrics: { label: string; average: number; count: number }[] = [];
                    if (detailed.punctuality) metrics.push({ label: "Punctuality", ...detailed.punctuality });
                    if (detailed.professionalism) metrics.push({ label: "Professionalism", ...detailed.professionalism });
                    if (detailed.skillCompetence) metrics.push({ label: "Skill / Competence", ...detailed.skillCompetence });

                    if (metrics.length === 0) return null;

                    return (
                      <WorkerRatingDetail
                        overall={detailed.overall}
                        metrics={metrics}
                        reliability={detailed.reliability ?? null}
                      />
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
