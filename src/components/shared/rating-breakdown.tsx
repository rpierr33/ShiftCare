"use client";

import { Star } from "lucide-react";

interface MetricData {
  label: string;
  average: number;
  count: number;
}

interface RatingBreakdownProps {
  overall: { average: number; count: number };
  metrics: MetricData[];
  reliability?: number | null;
  compact?: boolean;
}

export function RatingBreakdown({ overall, metrics, reliability, compact }: RatingBreakdownProps) {
  if (overall.count === 0) {
    return (
      <div className="text-sm text-gray-400">No ratings yet</div>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {/* Overall score */}
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
        <span className="text-lg font-bold text-gray-900">
          {overall.average.toFixed(1)}
        </span>
        <span className="text-sm text-gray-500">
          ({overall.count} {overall.count === 1 ? "review" : "reviews"})
        </span>
      </div>

      {/* Sub-metric bars */}
      <div className="space-y-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center gap-2">
            <span className={`${compact ? "w-24" : "w-32"} text-xs font-medium text-gray-600 truncate`}>
              {metric.label}
            </span>
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${(metric.average / 5) * 100}%` }}
                />
              </div>
            </div>
            <span className="w-8 text-right text-xs font-medium text-gray-700">
              {metric.count > 0 ? metric.average.toFixed(1) : "—"}
            </span>
          </div>
        ))}

        {/* Reliability score (computed, not from ratings) */}
        {reliability != null && (
          <div className="flex items-center gap-2">
            <span className={`${compact ? "w-24" : "w-32"} text-xs font-medium text-gray-600`}>
              Reliability
            </span>
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    reliability >= 90
                      ? "bg-emerald-500"
                      : reliability >= 75
                        ? "bg-amber-400"
                        : "bg-red-400"
                  }`}
                  style={{ width: `${reliability}%` }}
                />
              </div>
            </div>
            <span className={`w-8 text-right text-xs font-medium ${
              reliability >= 90
                ? "text-emerald-600"
                : reliability >= 75
                  ? "text-amber-600"
                  : "text-red-600"
            }`}>
              {reliability.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
