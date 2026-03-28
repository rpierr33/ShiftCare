"use client";

import { useState } from "react";
import { Calculator, TrendingUp } from "lucide-react";

const ROLES = [
  { label: "RN — Registered Nurse", min: 35, max: 42 },
  { label: "LPN — Licensed Practical Nurse", min: 28, max: 35 },
  { label: "CNA — Certified Nursing Assistant", min: 22, max: 28 },
  { label: "HHA — Home Health Aide", min: 18, max: 24 },
  { label: "Companion", min: 15, max: 20 },
];

const CITIES = ["Tampa", "Orlando", "Miami", "Jacksonville", "St. Petersburg"];
const SHIFTS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
const HOURS_OPTIONS = [4, 8, 12];

const PLATFORM_FEE = 0.10;

/* Interactive earnings calculator for workers — computes weekly/monthly take-home
   based on role, city, shifts per week, and hours per shift minus platform fee */
export function EarningsCalculator() {
  const [roleIndex, setRoleIndex] = useState(2); // CNA default
  const [city, setCity] = useState("Tampa");
  const [shiftsPerWeek, setShiftsPerWeek] = useState(3);
  const [hoursPerShift, setHoursPerShift] = useState(8);

  const role = ROLES[roleIndex];
  const midpoint = (role.min + role.max) / 2;
  const grossWeekly = midpoint * hoursPerShift * shiftsPerWeek;
  const netWeekly = grossWeekly * (1 - PLATFORM_FEE);
  const grossMonthly = grossWeekly * 4.3;
  const netMonthly = netWeekly * 4.3;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-teal-600 to-cyan-700 p-[1px]">
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <Calculator size={20} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              How Much Can You Earn?
            </h3>
            <p className="text-xs text-slate-400">
              Estimate your weekly and monthly take-home pay
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Your Role
            </label>
            <select
              value={roleIndex}
              onChange={(e) => setRoleIndex(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            >
              {ROLES.map((r, i) => (
                <option key={r.label} value={i} className="bg-slate-800">
                  {r.label} (${r.min}-${r.max}/hr)
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              City
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            >
              {CITIES.map((c) => (
                <option key={c} value={c} className="bg-slate-800">
                  {c}, FL
                </option>
              ))}
            </select>
          </div>

          {/* Shifts per week */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Shifts per Week
            </label>
            <div className="flex gap-1.5">
              {SHIFTS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setShiftsPerWeek(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    shiftsPerWeek === s
                      ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Hours per shift */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Hours per Shift
            </label>
            <div className="flex gap-2">
              {HOURS_OPTIONS.map((h) => (
                <button
                  key={h}
                  onClick={() => setHoursPerShift(h)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    hoursPerShift === h
                      ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {h}hr
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 rounded-xl p-5">
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Weekly */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Weekly Estimate
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  ${Math.round(netWeekly).toLocaleString()}
                </span>
                <span className="text-sm text-slate-500">/week</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Gross: ${Math.round(grossWeekly).toLocaleString()}/week
              </p>
            </div>

            {/* Monthly */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Monthly Projection
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-cyan-400">
                  ${Math.round(netMonthly).toLocaleString()}
                </span>
                <span className="text-sm text-slate-500">/month</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Gross: ${Math.round(grossMonthly).toLocaleString()}/month
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-white/5">
            <TrendingUp size={14} className="text-cyan-400" />
            <p className="text-xs text-slate-400">
              After 10% service fee (deducted from your earnings). Based on {city}, FL market rates for{" "}
              {role.label.split(" — ")[0]} at ${role.min}-${role.max}/hr.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
