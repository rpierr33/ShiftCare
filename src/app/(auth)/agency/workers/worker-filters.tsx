"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search } from "lucide-react";

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "RN", label: "RN" },
  { value: "LPN", label: "LPN" },
  { value: "CNA", label: "CNA" },
  { value: "HHA", label: "HHA" },
  { value: "MEDICAL_ASSISTANT", label: "Medical Assistant" },
  { value: "COMPANION", label: "Companion" },
  { value: "OTHER", label: "Other" },
];

const RELIABILITY_OPTIONS = [
  { value: "", label: "All Reliability" },
  { value: "90", label: "90%+" },
  { value: "75", label: "75%+" },
  { value: "under75", label: "Under 75%" },
];

const RATING_OPTIONS = [
  { value: "", label: "All Ratings" },
  { value: "4", label: "4+" },
  { value: "3", label: "3+" },
  { value: "under3", label: "Under 3" },
];

export function WorkerFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const role = searchParams.get("role") ?? "";
  const reliability = searchParams.get("reliability") ?? "";
  const rating = searchParams.get("rating") ?? "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const qs = params.toString();
      router.push(qs ? `?${qs}` : "/agency/workers", { scroll: false });
    },
    [router, searchParams]
  );

  const selectClass =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors";

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
      {/* Search */}
      <div className="relative flex-1 w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => updateParam("search", e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
        />
      </div>

      {/* Role */}
      <select
        value={role}
        onChange={(e) => updateParam("role", e.target.value)}
        className={selectClass}
      >
        {ROLE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Reliability */}
      <select
        value={reliability}
        onChange={(e) => updateParam("reliability", e.target.value)}
        className={selectClass}
      >
        {RELIABILITY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Rating */}
      <select
        value={rating}
        onChange={(e) => updateParam("rating", e.target.value)}
        className={selectClass}
      >
        {RATING_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
