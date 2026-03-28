"use client";

import { useState, useTransition } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import { Download, Loader2, TrendingUp } from "lucide-react";
import { getEarningsCSV } from "@/actions/earnings";
import type { MonthlyEarning } from "@/actions/earnings";

interface EarningsChartProps {
  data: MonthlyEarning[];
}

export default function EarningsChart({ data }: EarningsChartProps) {
  const [isPending, startTransition] = useTransition();

  // Calculate "on pace" projection for the current month
  const currentMonth = data[data.length - 1];
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projectedEarnings =
    currentMonth && dayOfMonth > 0 && currentMonth.earned > 0
      ? Math.round((currentMonth.earned / dayOfMonth) * daysInMonth * 100) / 100
      : 0;

  function handleDownloadCSV() {
    startTransition(async () => {
      const csv = await getEarningsCSV();
      if (!csv) return;

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shiftcare-earnings-${now.toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  const hasData = data.some((d) => d.earned > 0);

  if (!hasData) {
    return null;
  }

  return (
    <section className="mb-10">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">Monthly Earnings</h2>
        <button
          onClick={handleDownloadCSV}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export CSV
        </button>
      </div>

      {/* Projection banner */}
      {projectedEarnings > 0 && (
        <div className="bg-gradient-to-r from-cyan-50 to-emerald-50 border border-cyan-200 rounded-xl px-5 py-3 mb-5 flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-cyan-600 flex-shrink-0" />
          <p className="text-sm text-cyan-800">
            <span className="font-semibold">On pace for ${projectedEarnings.toLocaleString()}</span>{" "}
            this month based on your daily average
          </p>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${v}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}h`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                fontSize: 13,
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => {
                const num = typeof value === "number" ? value : parseFloat(String(value ?? 0));
                if (name === "earned") return [`$${num.toFixed(2)}`, "Earnings"];
                if (name === "hours") return [`${num}h`, "Hours"];
                return [String(value ?? ""), String(name ?? "")];
              }}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            />
            <Bar
              yAxisId="left"
              dataKey="earned"
              fill="#06b6d4"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="hours"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: "#10b981", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-cyan-500" />
            Earnings
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
            Hours worked
          </div>
        </div>
      </div>
    </section>
  );
}
