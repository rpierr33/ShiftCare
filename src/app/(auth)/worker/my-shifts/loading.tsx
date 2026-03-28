import { MyShiftCardSkeleton, Skeleton } from "@/components/shared/skeleton";

export default function MyShiftsLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="h-7 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="mt-2 h-4 w-56 bg-slate-100 rounded animate-pulse" />
      </div>

      {/* Earnings summary skeleton */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming section */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <MyShiftCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
