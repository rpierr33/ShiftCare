import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing | ShiftCare",
  description:
    "Simple pricing for healthcare shift fulfillment. Workers always free.",
};

const tiers = [
  {
    name: "Free",
    price: "$0",
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
    name: "Starter",
    price: "$49",
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
    name: "Professional",
    price: "$149",
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

export default function PricingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="pt-20 pb-4 text-center px-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          Simple, Transparent Pricing
        </h1>
        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mt-5 leading-relaxed">
          Workers are always free. Employers subscribe to remove per-shift fees.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border p-8 flex flex-col ${
                tier.highlighted
                  ? "border-blue-500/50 bg-blue-500/5 shadow-xl shadow-blue-500/10 relative"
                  : "border-white/10 bg-white/[0.04]"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-white">{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">
                  {tier.price}
                </span>
                <span className="text-slate-500 text-sm">{tier.period}</span>
              </div>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                {tier.description}
              </p>

              <ul className="mt-8 space-y-3 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check
                      size={16}
                      className="text-blue-400 mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={`mt-8 inline-flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-lg transition-all text-sm ${
                  tier.highlighted
                    ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/25"
                    : "bg-white/10 text-white hover:bg-white/15 border border-white/10"
                }`}
              >
                {tier.cta}
                <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>

        {/* Workers free callout */}
        <div className="mt-16 max-w-2xl mx-auto text-center bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-2">
            Workers Always Free
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
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
        <div className="mt-8 max-w-2xl mx-auto text-center bg-slate-800/50 border border-white/10 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-2">
            No Subscription? No Problem.
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-2">
            Any employer can post shifts without subscribing.
            A 15% platform fee applies per shift when you don&apos;t have an active plan.
          </p>
          <p className="text-slate-500 text-xs leading-relaxed mb-6">
            Subscribe to any paid plan to remove the per-shift fee entirely.
          </p>
          <Link
            href="/signup?role=PROVIDER"
            className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/15 border border-white/10 transition-colors text-sm"
          >
            Get Started
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-lg font-bold text-white">ShiftCare</div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} ShiftCare. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
