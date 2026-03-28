"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X as XIcon, ArrowRight, Shield, Calculator, TrendingUp, Lock, UserCheck } from "lucide-react";

const MONTHLY_PRICES = { Free: "$0", Starter: "$49", Professional: "$149" };
const ANNUAL_PRICES = { Free: "$0", Starter: "$39", Professional: "$119" };

const tiers = [
  {
    name: "Free" as const,
    period: "forever",
    description: "Get started with the essentials.",
    features: [
      "3 shift postings per month",
      "2 worker profile unlocks",
      "Basic shift management",
      "Email support",
    ],
    cta: "Get Started Free",
    href: "/signup?role=PROVIDER&plan=free",
    highlighted: false,
  },
  {
    name: "Starter" as const,
    period: "/mo",
    description: "For growing employers that need reliable coverage.",
    features: [
      "25 shift postings per month",
      "15 worker profile unlocks",
      "Direct contact with workers",
      "Shift analytics dashboard",
      "Priority email support",
    ],
    cta: "Start with Starter",
    href: "/signup?role=PROVIDER&plan=starter",
    highlighted: true,
  },
  {
    name: "Professional" as const,
    period: "/mo",
    description: "Unlimited staffing power for busy facilities.",
    features: [
      "Unlimited shift postings",
      "Unlimited worker unlocks",
      "Priority shift listings",
      "Advanced reporting",
      "Dedicated account manager",
      "API access",
    ],
    cta: "Go Professional",
    href: "/signup?role=PROVIDER&plan=professional",
    highlighted: false,
  },
];

const COMPARISON_ROWS: {
  feature: string;
  free: string;
  starter: string;
  professional: string;
}[] = [
  { feature: "Shift postings per month", free: "3", starter: "25", professional: "Unlimited" },
  { feature: "Worker profile unlocks", free: "2", starter: "15", professional: "Unlimited" },
  { feature: "Same-day pay (employer toggle per shift)", free: "check", starter: "check", professional: "check" },
  { feature: "Preferred worker invites", free: "x", starter: "check", professional: "check" },
  { feature: "Priority email support", free: "x", starter: "check", professional: "check" },
  { feature: "Analytics dashboard", free: "x", starter: "Basic", professional: "Advanced" },
  { feature: "Bulk shift posting", free: "x", starter: "check", professional: "check" },
  { feature: "Credential verification", free: "check", starter: "check", professional: "check" },
  { feature: "Custom branding", free: "x", starter: "x", professional: "check" },
];

/* Renders a feature comparison table cell: checkmark, X, or text value */
function ComparisonCell({ value }: { value: string }) {
  if (value === "check") {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50">
        <Check size={14} className="text-emerald-600" />
      </span>
    );
  }
  if (value === "x") {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100">
        <XIcon size={14} className="text-slate-400" />
      </span>
    );
  }
  return <span className="text-sm font-medium text-slate-700">{value}</span>;
}

/* Interactive calculator comparing per-shift fees (15%) vs. flat Starter plan ($49/mo).
   Helps employers determine when upgrading to a paid plan saves money. */
function BreakEvenCalculator() {
  const [shifts, setShifts] = useState(10);
  const [avgValue, setAvgValue] = useState(200);

  const perShiftCost = shifts * avgValue * 0.15;
  const starterPrice = 49;
  const savings = perShiftCost - starterPrice;
  const starterWins = savings > 0;

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
            <Calculator size={20} className="text-cyan-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              When Does Starter Pay for Itself?
            </h3>
            <p className="text-sm text-slate-500">
              Compare per-shift fees vs. a flat monthly plan
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Shifts per month
            </label>
            <input
              type="range"
              min={1}
              max={50}
              value={shifts}
              onChange={(e) => setShifts(Number(e.target.value))}
              className="w-full accent-cyan-600"
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-slate-400">1</span>
              <span className="text-lg font-bold text-cyan-600">{shifts}</span>
              <span className="text-xs text-slate-400">50</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Average shift value ($)
            </label>
            <input
              type="number"
              min={50}
              max={1000}
              value={avgValue}
              onChange={(e) => setAvgValue(Math.max(0, Number(e.target.value)))}
              className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Comparison */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Employer Per-Shift Fees (15%)
            </p>
            <p className="text-2xl font-extrabold text-slate-900">
              ${Math.round(perShiftCost).toLocaleString()}
              <span className="text-sm font-normal text-slate-500">/mo</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {shifts} shifts x ${avgValue} x 15%
            </p>
          </div>
          <div className="bg-white rounded-xl border border-cyan-200 p-4">
            <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-1">
              Starter Plan
            </p>
            <p className="text-2xl font-extrabold text-slate-900">
              $49
              <span className="text-sm font-normal text-slate-500">/mo</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Flat rate, no per-shift fees
            </p>
          </div>
        </div>

        {/* Result */}
        <div
          className={`rounded-xl p-4 flex items-center gap-3 ${
            starterWins
              ? "bg-emerald-50 border border-emerald-200"
              : "bg-slate-50 border border-slate-200"
          }`}
        >
          <TrendingUp
            size={20}
            className={starterWins ? "text-emerald-600" : "text-slate-400"}
          />
          <p
            className={`text-sm font-semibold ${
              starterWins ? "text-emerald-700" : "text-slate-600"
            }`}
          >
            {starterWins
              ? `Starter saves you $${Math.round(savings).toLocaleString()}/month vs. per-shift fees!`
              : `Free plan is best for your volume. You'd pay $${Math.round(perShiftCost)}/mo in per-shift fees.`}
          </p>
        </div>
      </div>
    </section>
  );
}

/* Main pricing page content: annual/monthly toggle, 3-tier pricing cards, comparison table,
   "Workers Always Free" callout, pay-as-you-go option, and break-even calculator */
export function PricingContent() {
  const [annual, setAnnual] = useState(false);
  const prices = annual ? ANNUAL_PRICES : MONTHLY_PRICES;

  return (
    <>
      {/* Hero */}
      <section className="pt-28 pb-4 text-center px-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          Simple, Transparent Pricing
        </h1>
        <p className="text-slate-500 text-lg sm:text-xl max-w-2xl mx-auto mt-5 leading-relaxed">
          Workers are always free. Employers subscribe to remove per-shift fees.
        </p>
      </section>

      {/* Annual/Monthly Toggle */}
      <section className="flex justify-center px-4 pt-8 pb-2">
        <div className="inline-flex items-center bg-slate-100 rounded-full p-1">
          <button
            onClick={() => setAnnual(false)}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              !annual
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              annual
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Annual
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border p-8 flex flex-col ${
                tier.highlighted
                  ? "border-cyan-500/50 bg-cyan-50 shadow-xl shadow-cyan-500/10 relative"
                  : "border-slate-200 bg-white"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-cyan-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">
                  {prices[tier.name]}
                </span>
                <span className="text-slate-500 text-sm">
                  {tier.name === "Free"
                    ? "forever"
                    : annual
                    ? "/mo (billed annually)"
                    : "/mo"}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                {tier.description}
              </p>

              <ul className="mt-8 space-y-3 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check
                      size={16}
                      className="text-cyan-600 mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={`mt-8 inline-flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-lg transition-all text-sm ${
                  tier.highlighted
                    ? "bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg shadow-cyan-600/25"
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {tier.cta}
                <ArrowRight size={16} />
              </Link>

              {tier.name === "Professional" && (
                <Link
                  href="/demo"
                  className="mt-3 inline-flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-lg transition-all text-sm border border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                >
                  Book a Demo
                  <ArrowRight size={16} />
                </Link>
              )}

              {/* Trust signals */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Shield size={12} className="text-slate-400" />
                  <span className="text-xs text-slate-400">No contracts. Cancel anytime.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={12} className="text-slate-400" />
                  <span className="text-xs text-slate-400">No setup fees.</span>
                </div>
                {tier.name === "Free" && (
                  <div className="flex items-center gap-1.5">
                    <Check size={12} className="text-slate-400" />
                    <span className="text-xs text-slate-400">Free plan never expires.</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: <Shield size={14} />, label: "HIPAA Compliant" },
            { icon: <Lock size={14} />, label: "Secure Payments" },
            { icon: <UserCheck size={14} />, label: "Background Checked" },
          ].map((b) => (
            <span
              key={b.label}
              className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium px-3.5 py-2 rounded-full"
            >
              {b.icon}
              {b.label}
            </span>
          ))}
        </div>

        {/* Workers free callout */}
        <div className="mt-16 max-w-2xl mx-auto text-center bg-emerald-50 border border-emerald-200 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Workers Always Free
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Healthcare professionals use ShiftCare completely free. Create your
            profile, browse open shifts, and start working on your schedule.
          </p>
          <Link
            href="/signup?role=WORKER"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-emerald-500 transition-colors text-sm"
          >
            Sign Up as a Worker
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* No subscription option */}
        <div className="mt-8 max-w-2xl mx-auto text-center bg-slate-50 border border-slate-200 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            No Subscription? No Problem.
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-2">
            Any employer can post shifts without subscribing.
            A 15% employer fee is charged per shift when you don&apos;t have an active plan. This fee is charged to employers, not workers.
          </p>
          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            Subscribe to any paid plan to remove the per-shift fee entirely.
          </p>
          <Link
            href="/signup?role=PROVIDER"
            className="inline-flex items-center gap-2 bg-slate-100 text-slate-900 font-semibold px-6 py-3 rounded-lg hover:bg-slate-200 border border-slate-200 transition-colors text-sm"
          >
            Get Started
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Compare Plans
          </h2>
          <p className="text-slate-500 text-base mt-2">
            See exactly what you get with each plan.
          </p>
        </div>
        {/* Scroll hint for mobile */}
        <p className="text-center text-xs text-slate-400 mb-2 sm:hidden">
          &larr; Scroll to compare &rarr;
        </p>
        <div className="relative">
          {/* Right fade indicator on mobile */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 sm:hidden" />
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="sticky left-0 bg-white z-10 text-left text-sm font-semibold text-slate-500 py-4 pr-4 w-[40%]">
                    Feature
                  </th>
                  <th className="text-center text-sm font-semibold text-slate-900 py-4 px-4 w-[20%]">
                    Free
                  </th>
                  <th className="text-center text-sm font-semibold text-cyan-600 py-4 px-4 w-[20%]">
                    Starter
                  </th>
                  <th className="text-center text-sm font-semibold text-slate-900 py-4 pl-4 w-[20%]">
                    Professional
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-slate-100 ${
                      i % 2 === 0 ? "bg-slate-50/50" : ""
                    }`}
                  >
                    <td className={`sticky left-0 z-10 text-left text-sm text-slate-700 py-3.5 pr-4 font-medium ${i % 2 === 0 ? "bg-slate-50/50" : "bg-white"}`}>
                      {row.feature}
                    </td>
                    <td className="text-center py-3.5 px-4">
                      <div className="flex justify-center">
                        <ComparisonCell value={row.free} />
                      </div>
                    </td>
                    <td className="text-center py-3.5 px-4">
                      <div className="flex justify-center">
                        <ComparisonCell value={row.starter} />
                      </div>
                    </td>
                    <td className="text-center py-3.5 pl-4">
                      <div className="flex justify-center">
                        <ComparisonCell value={row.professional} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Break-Even Calculator */}
      <BreakEvenCalculator />
    </>
  );
}
