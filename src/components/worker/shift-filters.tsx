"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { useState, useEffect } from "react";

export function ShiftFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const minPay = searchParams.get("minPay") || "";
  const maxPay = searchParams.get("maxPay") || "";
  const minHours = searchParams.get("minHours") || "";
  const maxHours = searchParams.get("maxHours") || "";
  const maxDistance = searchParams.get("maxDistance") || "";

  const hasFilters = minPay || maxPay || minHours || maxHours || maxDistance;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.filter-panel-wrapper')) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const applyFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (val) params.set(key, val);
      else params.delete(key);
    }
    const qs = params.toString();
    router.push(`/worker/shifts${qs ? `?${qs}` : ""}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("minPay");
    params.delete("maxPay");
    params.delete("minHours");
    params.delete("maxHours");
    params.delete("maxDistance");
    const qs = params.toString();
    router.push(`/worker/shifts${qs ? `?${qs}` : ""}`);
    setOpen(false);
  };

  return (
    <div className="relative filter-panel-wrapper">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
          hasFilters
            ? "border-cyan-300 bg-cyan-50 text-cyan-700"
            : "border-gray-200 bg-white text-gray-500 hover:text-gray-700"
        }`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filters
        {hasFilters && (
          <span className="ml-1 rounded-full bg-cyan-600 px-1.5 py-0.5 text-[10px] text-white">
            {[minPay, maxPay, minHours, maxHours, maxDistance].filter(Boolean).length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-800">Filter Shifts</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Pay Range */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Pay Rate ($/hr)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                defaultValue={minPay}
                min={0}
                className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                onBlur={(e) => applyFilters({ minPay: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyFilters({ minPay: (e.target as HTMLInputElement).value });
                }}
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="number"
                placeholder="Max"
                defaultValue={maxPay}
                min={0}
                className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                onBlur={(e) => applyFilters({ maxPay: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyFilters({ maxPay: (e.target as HTMLInputElement).value });
                }}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Shift Duration (hours)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                defaultValue={minHours}
                min={0}
                className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                onBlur={(e) => applyFilters({ minHours: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyFilters({ minHours: (e.target as HTMLInputElement).value });
                }}
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="number"
                placeholder="Max"
                defaultValue={maxHours}
                min={0}
                className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                onBlur={(e) => applyFilters({ maxHours: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyFilters({ maxHours: (e.target as HTMLInputElement).value });
                }}
              />
            </div>
          </div>

          {/* Max Distance */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Max Distance (miles)
            </label>
            <input
              type="number"
              placeholder="e.g. 25"
              defaultValue={maxDistance}
              min={1}
              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              onBlur={(e) => applyFilters({ maxDistance: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters({ maxDistance: (e.target as HTMLInputElement).value });
              }}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                { label: "5 mi", value: "5" },
                { label: "10 mi", value: "10" },
                { label: "25 mi", value: "25" },
                { label: "50 mi", value: "50" },
              ].map((d) => (
                <button
                  key={d.value}
                  onClick={() => applyFilters({ maxDistance: d.value })}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                    maxDistance === d.value
                      ? "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-300"
                      : "bg-gray-100 text-gray-600 hover:bg-cyan-50 hover:text-cyan-700"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick filters */}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Quick filters</p>
            <div className="flex flex-wrap gap-1.5">
              {([
                { label: "$25+/hr", filters: { minPay: "25" } },
                { label: "$30+/hr", filters: { minPay: "30" } },
                { label: "4-8 hrs", filters: { minHours: "4", maxHours: "8" } },
                { label: "8+ hrs", filters: { minHours: "8" } },
                { label: "12h shifts", filters: { minHours: "11", maxHours: "13" } },
              ] as { label: string; filters: Record<string, string> }[]).map((q) => (
                <button
                  key={q.label}
                  onClick={() => applyFilters(q.filters)}
                  className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600 hover:bg-cyan-50 hover:text-cyan-700 transition"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
