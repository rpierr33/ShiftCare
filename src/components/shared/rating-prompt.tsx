"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { submitRating } from "@/actions/ratings";

interface RatingPromptProps {
  shiftId: string;
  rateeName: string;
  rateeRole: "worker" | "employer";
}

const WORKER_METRICS = [
  { key: "punctuality", label: "Punctuality", desc: "Arrived on time?" },
  { key: "professionalism", label: "Professionalism", desc: "Communication & attitude" },
  { key: "skillCompetence", label: "Skill & Competence", desc: "Quality of care" },
] as const;

const PROVIDER_METRICS = [
  { key: "communication", label: "Communication", desc: "Clear instructions, responsive" },
  { key: "workEnvironment", label: "Work Environment", desc: "Safe, organized, equipped" },
  { key: "paymentReliability", label: "Payment Reliability", desc: "Pays on time, no disputes" },
  { key: "fairness", label: "Fairness", desc: "Reasonable expectations" },
] as const;

function StarRow({
  label,
  desc,
  value,
  onChange,
  disabled,
}: {
  label: string;
  desc: string;
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-36 shrink-0">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-[11px] text-slate-400">{desc}</p>
      </div>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            className="p-0.5 transition-transform hover:scale-110"
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(s)}
            disabled={disabled}
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                s <= display ? "fill-amber-400 text-amber-400" : "text-slate-300"
              }`}
            />
          </button>
        ))}
      </div>
      {value > 0 && (
        <span className="text-xs text-slate-400">{value}/5</span>
      )}
    </div>
  );
}

/* Multi-metric rating form — workers rate employers on 4 categories, employers rate
   workers on 3 categories. Computes weighted overall score and submits via server action. */
export function RatingPrompt({ shiftId, rateeName, rateeRole }: RatingPromptProps) {
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metricDefs = rateeRole === "worker" ? WORKER_METRICS : PROVIDER_METRICS;
  const allFilled = metricDefs.every((m) => metrics[m.key] > 0);

  // Compute overall score
  const overallScore = allFilled
    ? rateeRole === "worker"
      ? Math.round(
          (metrics.punctuality || 0) * 0.3 +
          (metrics.professionalism || 0) * 0.3 +
          (metrics.skillCompetence || 0) * 0.4
        )
      : Math.round(
          ((metrics.communication || 0) +
            (metrics.workEnvironment || 0) +
            (metrics.paymentReliability || 0) +
            (metrics.fairness || 0)) / 4
        )
    : 0;

  async function handleSubmit() {
    if (!allFilled) {
      setError("Please rate all categories.");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const result = await submitRating({
      shiftId,
      score: overallScore,
      comment: comment || undefined,
      ...(rateeRole === "worker"
        ? {
            punctuality: metrics.punctuality,
            professionalism: metrics.professionalism,
            skillCompetence: metrics.skillCompetence,
          }
        : {
            communication: metrics.communication,
            workEnvironment: metrics.workEnvironment,
            paymentReliability: metrics.paymentReliability,
            fairness: metrics.fairness,
          }),
    });
    setIsSubmitting(false);

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error || "Failed to submit rating.");
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= overallScore
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300"
                }`}
              />
            ))}
          </div>
          <p className="text-sm font-medium text-emerald-700">
            Thanks for your feedback!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-900 mb-1">
        Rate {rateeName}
      </p>
      <p className="text-xs text-slate-400 mb-4">
        {rateeRole === "worker"
          ? "Rate this worker across key performance areas"
          : "Rate this employer across key workplace areas"}
      </p>

      {/* Sub-metric star rows */}
      <div className="space-y-1 mb-4">
        {metricDefs.map((m) => (
          <StarRow
            key={m.key}
            label={m.label}
            desc={m.desc}
            value={metrics[m.key] || 0}
            onChange={(v) => {
              setMetrics((prev) => ({ ...prev, [m.key]: v }));
              setError(null);
            }}
            disabled={isSubmitting}
          />
        ))}
      </div>

      {/* Overall score display */}
      {allFilled && (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 mb-4">
          <span className="text-xs font-medium text-slate-500">Overall:</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-4 w-4 ${
                  s <= overallScore ? "fill-amber-400 text-amber-400" : "text-slate-300"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-bold text-slate-700">{overallScore}/5</span>
        </div>
      )}

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="How was your experience? (optional)"
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
        rows={2}
        disabled={isSubmitting}
        maxLength={500}
      />

      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || !allFilled}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? "Submitting..." : "Submit Rating"}
      </button>
    </div>
  );
}
