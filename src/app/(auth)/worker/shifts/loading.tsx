import { ShiftCardSkeleton } from "@/components/shared/skeleton";

export default function WorkerShiftsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-7 w-40 bg-slate-200 rounded animate-pulse" />
          <div className="mt-2 h-4 w-64 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-24 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-9 w-20 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Grid of shift card skeletons */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ShiftCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
