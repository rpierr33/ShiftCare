import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
  DollarSign,
  CreditCard,
  Star,
  Award,
} from "lucide-react";

export const metadata = {
  title: "Admin Dashboard | ShiftCare",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Fetch all stats in parallel
  const [
    totalUsers,
    totalProviders,
    totalWorkers,
    activeShifts,
    completedThisMonth,
    pendingProviders,
    pendingCredentials,
    openDisputes,
    recentSignups,
    completedShiftsWithTimes,
    disputedThisMonth,
    totalCompletedThisMonth,
    verifiedWorkers,
    totalWorkersCount,
    // Revenue queries
    starterSubscribers,
    professionalSubscribers,
    releasedShiftsThisMonth,
    // Top performers
    topEarningWorkers,
    topRatedWorkers,
    topRatedProviders,
  ] = await Promise.all([
    // Total users
    db.user.count({ where: { isActive: true } }),
    // Total providers
    db.user.count({ where: { role: "PROVIDER", isActive: true } }),
    // Total workers
    db.user.count({ where: { role: "WORKER", isActive: true } }),
    // Active shifts (OPEN + ASSIGNED + IN_PROGRESS)
    db.shift.count({
      where: { status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] } },
    }),
    // Completed this month
    db.shift.count({
      where: {
        status: "COMPLETED",
        updatedAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    // Pending provider verifications
    db.providerProfile.count({
      where: { onboardingComplete: true, complianceStatus: "PENDING" },
    }),
    // Pending credential reviews
    db.workerProfile.count({
      where: { credentialStatus: "PENDING" },
    }),
    // Open disputes
    db.shift.count({
      where: { status: "DISPUTED" },
    }),
    // Recent signups (last 10)
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, role: true, createdAt: true },
    }),
    // Completed shifts this month with timing data for avg fill time
    db.shift.findMany({
      where: {
        status: "COMPLETED",
        assignedAt: { not: null },
        updatedAt: { gte: monthStart, lte: monthEnd },
      },
      select: { createdAt: true, assignedAt: true },
    }),
    // Disputed this month
    db.shift.count({
      where: {
        status: "DISPUTED",
        updatedAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    // Total completed + disputed this month (for dispute rate)
    db.shift.count({
      where: {
        status: { in: ["COMPLETED", "DISPUTED"] },
        updatedAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    // Verified workers
    db.workerProfile.count({
      where: { credentialStatus: "VERIFIED" },
    }),
    // Total workers with profiles
    db.workerProfile.count(),

    // --- Revenue ---
    // STARTER subscribers count
    db.providerProfile.count({
      where: { subscriptionPlan: "STARTER", subscriptionStatus: "ACTIVE" },
    }),
    // PROFESSIONAL subscribers count
    db.providerProfile.count({
      where: { subscriptionPlan: "PROFESSIONAL", subscriptionStatus: "ACTIVE" },
    }),
    // Shifts with RELEASED payment this month (for transaction fee revenue)
    db.shift.findMany({
      where: {
        paymentStatus: "RELEASED",
        updatedAt: { gte: monthStart, lte: monthEnd },
      },
      select: { platformFeeAmount: true },
    }),

    // --- Top Performers ---
    // Top earning workers
    db.workerProfile.findMany({
      orderBy: { totalEarnings: "desc" },
      take: 5,
      include: {
        user: { select: { id: true, name: true } },
      },
    }),
    // Top rated workers (by avg rating)
    db.rating.groupBy({
      by: ["rateeId"],
      _avg: { score: true },
      _count: true,
      orderBy: { _avg: { score: "desc" } },
      take: 10, // Fetch more to filter to workers
    }),
    // Top rated providers (by avg rating) - fetch separately
    db.rating.groupBy({
      by: ["rateeId"],
      _avg: { score: true },
      _count: true,
      orderBy: { _avg: { score: "desc" } },
      take: 10, // Fetch more to filter to providers
    }),
  ]);

  // Calculate avg fill time (hours from creation to assignment)
  let avgFillTimeHours: number | null = null;
  if (completedShiftsWithTimes.length > 0) {
    const totalHours = completedShiftsWithTimes.reduce((sum, s) => {
      if (!s.assignedAt) return sum;
      const diffMs = s.assignedAt.getTime() - s.createdAt.getTime();
      return sum + diffMs / (1000 * 60 * 60);
    }, 0);
    const shiftsWithAssignment = completedShiftsWithTimes.filter(
      (s) => s.assignedAt
    ).length;
    if (shiftsWithAssignment > 0) {
      avgFillTimeHours = totalHours / shiftsWithAssignment;
    }
  }

  // Dispute rate
  const disputeRate =
    totalCompletedThisMonth > 0
      ? (disputedThisMonth / totalCompletedThisMonth) * 100
      : 0;

  // Worker verification rate
  const verificationRate =
    totalWorkersCount > 0
      ? (verifiedWorkers / totalWorkersCount) * 100
      : 0;

  const pendingActions = pendingProviders + pendingCredentials + openDisputes;

  // Revenue calculations
  const subscriptionRevenue = starterSubscribers * 49 + professionalSubscribers * 149;
  const transactionFeeRevenue = releasedShiftsThisMonth.reduce((sum, s) => {
    return sum + (s.platformFeeAmount ? parseFloat(s.platformFeeAmount.toString()) : 0);
  }, 0);
  const totalRevenue = subscriptionRevenue + transactionFeeRevenue;

  // Resolve top rated users - need to fetch user details
  const allRatedUserIds = [
    ...topRatedWorkers.map((r) => r.rateeId),
    ...topRatedProviders.map((r) => r.rateeId),
  ];
  const uniqueRatedUserIds = [...new Set(allRatedUserIds)];
  const ratedUsers =
    uniqueRatedUserIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: uniqueRatedUserIds } },
          select: { id: true, name: true, role: true },
        })
      : [];
  const ratedUserMap = new Map(ratedUsers.map((u) => [u.id, u]));

  // Filter top rated by role
  const topRatedWorkersResolved = topRatedWorkers
    .filter((r) => ratedUserMap.get(r.rateeId)?.role === "WORKER")
    .slice(0, 5)
    .map((r) => ({
      userId: r.rateeId,
      name: ratedUserMap.get(r.rateeId)?.name || "Unknown",
      avgRating: r._avg.score ?? 0,
      totalReviews: r._count,
    }));

  const topRatedProvidersResolved = topRatedProviders
    .filter((r) => ratedUserMap.get(r.rateeId)?.role === "PROVIDER")
    .slice(0, 5)
    .map((r) => ({
      userId: r.rateeId,
      name: ratedUserMap.get(r.rateeId)?.name || "Unknown",
      avgRating: r._avg.score ?? 0,
      totalReviews: r._count,
    }));

  // Prepare top earning workers with parsed Decimal
  const topEarners = topEarningWorkers
    .filter((w) => parseFloat(w.totalEarnings.toString()) > 0)
    .slice(0, 5)
    .map((w) => ({
      userId: w.user.id,
      name: w.user.name,
      role: w.workerRole,
      totalEarnings: parseFloat(w.totalEarnings.toString()),
    }));

  const monthName = new Intl.DateTimeFormat("en-US", { month: "long" }).format(now);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Real-time snapshot of ShiftCare operations
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Users className="h-5 w-5 text-slate-600" />}
          label="Total Users"
          value={totalUsers.toLocaleString()}
          detail={`${totalProviders} providers, ${totalWorkers} workers`}
        />
        <StatCard
          icon={<Calendar className="h-5 w-5 text-cyan-600" />}
          label="Active Shifts"
          value={activeShifts.toLocaleString()}
          detail="Open + Assigned + In Progress"
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
          label="Completed This Month"
          value={completedThisMonth.toLocaleString()}
          detail={monthName}
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          label="Revenue This Month"
          value={`$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          detail="Subscriptions + Transaction Fees"
          highlight={totalRevenue > 0}
        />
      </div>

      {/* Revenue Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-amber-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Subscription Revenue
            </h2>
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-4">
            ${subscriptionRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-normal text-slate-400 ml-1">/mo</span>
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Starter ($49/mo)</span>
              <span className="font-medium text-slate-700">
                {starterSubscribers} subscriber{starterSubscribers !== 1 ? "s" : ""} = ${(starterSubscribers * 49).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Professional ($149/mo)</span>
              <span className="font-medium text-slate-700">
                {professionalSubscribers} subscriber{professionalSubscribers !== 1 ? "s" : ""} = ${(professionalSubscribers * 149).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Transaction Fee Revenue
            </h2>
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-4">
            ${transactionFeeRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-normal text-slate-400 ml-1">this month</span>
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Shifts with released payments</span>
              <span className="font-medium text-slate-700">
                {releasedShiftsThisMonth.length} shift{releasedShiftsThisMonth.length !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Includes 15% non-subscriber surcharge + 10% worker platform fee
            </p>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Highest Earning Workers */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              Highest Earning Workers
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {topEarners.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                No earnings data yet
              </div>
            ) : (
              topEarners.map((worker, i) => (
                <div
                  key={worker.userId}
                  className="px-6 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {worker.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {worker.role || "Worker"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">
                    ${worker.totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Highest Rated Users */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              Highest Rated Users
            </h2>
          </div>
          <div>
            {/* Workers */}
            {topRatedWorkersResolved.length > 0 && (
              <div>
                <div className="px-6 py-2 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Workers
                </div>
                <div className="divide-y divide-slate-50">
                  {topRatedWorkersResolved.map((w) => (
                    <div
                      key={w.userId}
                      className="px-6 py-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {w.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {w.totalReviews} review{w.totalReviews !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-semibold text-slate-900">
                          {w.avgRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Providers */}
            {topRatedProvidersResolved.length > 0 && (
              <div>
                <div className="px-6 py-2 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Employers
                </div>
                <div className="divide-y divide-slate-50">
                  {topRatedProvidersResolved.map((p) => (
                    <div
                      key={p.userId}
                      className="px-6 py-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {p.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {p.totalReviews} review{p.totalReviews !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-semibold text-slate-900">
                          {p.avgRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {topRatedWorkersResolved.length === 0 &&
              topRatedProvidersResolved.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-400">
                  No ratings data yet
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Action queues */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <ActionQueueCard
          icon={<ShieldCheck className="h-5 w-5 text-blue-600" />}
          title="Provider Verifications"
          count={pendingProviders}
          href="/admin/providers"
          emptyText="All providers verified"
          color="blue"
        />
        <ActionQueueCard
          icon={<FileText className="h-5 w-5 text-violet-600" />}
          title="Credential Reviews"
          count={pendingCredentials}
          href="/admin/credentials"
          emptyText="All credentials reviewed"
          color="violet"
        />
        <ActionQueueCard
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          title="Open Disputes"
          count={openDisputes}
          href="/admin/disputes"
          emptyText="No open disputes"
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity feed */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900">
              Recent Signups
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {recentSignups.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                No signups yet
              </div>
            ) : (
              recentSignups.map((user) => (
                <div
                  key={user.id}
                  className="px-6 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        user.role === "PROVIDER"
                          ? "bg-cyan-600"
                          : "bg-violet-600"
                      }`}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {user.role === "PROVIDER" ? "Provider" : "Worker"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {formatRelativeDate(user.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Platform health */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900">
              Platform Health
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <HealthMetric
              icon={<TrendingUp className="h-4 w-4 text-cyan-600" />}
              label="Avg Fill Time (This Month)"
              value={
                avgFillTimeHours !== null
                  ? avgFillTimeHours < 1
                    ? `${Math.round(avgFillTimeHours * 60)} min`
                    : `${avgFillTimeHours.toFixed(1)} hrs`
                  : "No data"
              }
              detail="Time from shift posting to worker assignment"
            />
            <HealthMetric
              icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
              label="Dispute Rate"
              value={`${disputeRate.toFixed(1)}%`}
              detail={`${disputedThisMonth} disputed / ${totalCompletedThisMonth} total this month`}
              warning={disputeRate > 5}
            />
            <HealthMetric
              icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />}
              label="Worker Verification Rate"
              value={`${verificationRate.toFixed(0)}%`}
              detail={`${verifiedWorkers} verified / ${totalWorkersCount} total workers`}
            />
            <HealthMetric
              icon={<AlertCircle className="h-4 w-4 text-blue-600" />}
              label="Pending Actions"
              value={pendingActions.toString()}
              detail={`${pendingProviders} providers, ${pendingCredentials} credentials, ${openDisputes} disputes`}
              warning={pendingActions > 5}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Subcomponents ---

function StatCard({
  icon,
  label,
  value,
  detail,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border p-5 ${
        highlight ? "border-amber-200 bg-amber-50/30" : "border-slate-100"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{detail}</p>
    </div>
  );
}

function ActionQueueCard({
  icon,
  title,
  count,
  href,
  emptyText,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  href: string;
  emptyText: string;
  color: "blue" | "violet" | "amber";
}) {
  const bgMap = {
    blue: "bg-blue-50",
    violet: "bg-violet-50",
    amber: "bg-amber-50",
  };
  const textMap = {
    blue: "text-blue-700",
    violet: "text-violet-700",
    amber: "text-amber-700",
  };

  return (
    <Link
      href={href}
      className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-slate-200 hover:shadow-sm transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-slate-900">{title}</span>
        </div>
        {count > 0 && (
          <span
            className={`inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full text-xs font-bold ${bgMap[color]} ${textMap[color]}`}
          >
            {count}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400">
        {count > 0
          ? `${count} pending review${count !== 1 ? "s" : ""}`
          : emptyText}
      </p>
    </Link>
  );
}

function HealthMetric({
  icon,
  label,
  value,
  detail,
  warning = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  warning?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">{label}</p>
          <p
            className={`text-sm font-bold ${
              warning ? "text-amber-600" : "text-slate-900"
            }`}
          >
            {value}
          </p>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
