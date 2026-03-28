export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 rounded ${className || ""}`}
    />
  );
}

export function ShiftCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      {/* Top accent bar */}
      <div className="h-1 w-full bg-slate-100" />
      <div className="p-5 space-y-4">
        {/* Row 1: Role badge + pay */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-14 rounded-lg" />
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-7 w-16 ml-auto" />
            <Skeleton className="h-3 w-20 ml-auto" />
          </div>
        </div>

        {/* Row 2: Company name */}
        <Skeleton className="h-4 w-40" />

        {/* Row 3: Date/time */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-52" />
        </div>

        {/* Row 4: Location */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-36" />
        </div>

        {/* Row 5: Posted time */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>

        {/* Pay breakdown box */}
        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        {/* Accept button */}
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function MyShiftCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-gray-200 p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 space-y-3">
          {/* Badges */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-12 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          {/* Provider */}
          <Skeleton className="h-4 w-32" />
          {/* Location */}
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
          {/* Date */}
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="space-y-2 sm:text-right">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function DashboardStatSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}
