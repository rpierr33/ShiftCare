import { DashboardStatSkeleton, Skeleton, MyShiftCardSkeleton } from "@/components/shared/skeleton";

export default function AgencyDashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="h-7 w-40 bg-slate-200 rounded animate-pulse" />
        <div className="mt-2 h-4 w-64 bg-slate-100 rounded animate-pulse" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <DashboardStatSkeleton key={i} />
        ))}
      </div>

      {/* Action button skeleton */}
      <Skeleton className="h-12 w-48 rounded-xl" />

      {/* Recent shifts */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <MyShiftCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
