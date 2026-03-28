"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { RatingBreakdown } from "@/components/shared/rating-breakdown";

interface MetricData {
  label: string;
  average: number;
  count: number;
}

interface WorkerRatingDetailProps {
  overall: { average: number; count: number };
  metrics: MetricData[];
  reliability?: number | null;
}

export function WorkerRatingDetail({ overall, metrics, reliability }: WorkerRatingDetailProps) {
  const [expanded, setExpanded] = useState(false);

  if (overall.count === 0 || metrics.length === 0) {
    return null;
  }

  return (
    <div className="col-span-full">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
      >
        {expanded ? "Hide" : "View"} rating breakdown
        {expanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>
      {expanded && (
        <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 p-3 max-w-xs">
          <RatingBreakdown
            overall={overall}
            metrics={metrics}
            reliability={reliability}
            compact
          />
        </div>
      )}
    </div>
  );
}
