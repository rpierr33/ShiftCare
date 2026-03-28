import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  DollarSign,
  Zap,
  ArrowRight,
  Star,
  CheckCircle,
  Building2,
  Heart,
  UserCheck,
} from "lucide-react";
import { PublicNav } from "@/components/shared/public-nav";
import { PublicFooter } from "@/components/shared/public-footer";

export const metadata: Metadata = {
  title: "Home Care for Your Loved Ones | ShiftCare",
  description: "Find verified, background-checked caregivers for your loved ones. HHA, CNA, and companion care in Florida. No contracts, pay by the hour.",
  alternates: { canonical: "/for-families" },
};

const FEATURES = [
  {
    icon: <ShieldCheck size={24} className="text-violet-500" />,
    iconBg: "bg-violet-50",
    title: "Background Checked",
    description: "Every caregiver is credentialed and verified before their first shift.",
  },
  {
    icon: <Clock size={24} className="text-cyan-500" />,
    iconBg: "bg-cyan-50",
    title: "Flexible Hours",
    description: "Book care by the hour — mornings, evenings, weekends, or overnight.",
  },
  {
    icon: <DollarSign size={24} className="text-emerald-500" />,
    iconBg: "bg-emerald-50",
    title: "Transparent Pricing",
    description: "See exact costs upfront. No hidden fees, no long-term contracts.",
  },
  {
    icon: <Zap size={24} className="text-amber-500" />,
    iconBg: "bg-amber-50",
    title: "Same-Day Availability",
    description: "Need care today? Many caregivers available within hours.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Tell Us About Your Care Needs",
    description: "Share your loved one's requirements — schedule, location, and type of care needed.",
  },
  {
    number: "2",
    title: "Browse Verified Caregivers",
    description: "See profiles, ratings, experience, and availability. Every caregiver is background-checked.",
  },
  {
    number: "3",
    title: "Book and Manage Shifts",
    description: "Schedule care with a few taps. Track shifts, communicate with caregivers, and pay securely.",
  },
];

const SAMPLE_CAREGIVERS = [
  {
    name: "Maria G.",
    role: "HHA",
    years: 6,
    rating: 4.9,
    city: "Tampa, FL",
    initials: "MG",
    color: "bg-rose-400",
  },
  {
    name: "James W.",
    role: "CNA",
    years: 4,
    rating: 4.8,
    city: "Orlando, FL",
    initials: "JW",
    color: "bg-blue-400",
  },
  {
    name: "Linda P.",
    role: "Companion",
    years: 8,
    rating: 5.0,
    city: "St. Petersburg, FL",
    initials: "LP",
    color: "bg-emerald-400",
  },
];

/* For Families landing page — features, how-it-works, sample caregivers,
   hourly rate transparency, trust badges, and signup CTA for private employers */
export default function ForFamiliesPage() {
  return (
    <>
      <PublicNav currentPage="for-families" />

      {/* Hero */}
      <section className="pt-28 pb-20 sm:pt-36 sm:pb-28 px-4 bg-gradient-to-b from-violet-50 via-white to-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-sm font-semibold text-violet-600 uppercase tracking-wider mb-4">
            For Families
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-tight">
            Trusted Home Care,{" "}
            <span className="text-violet-600">On Your Schedule</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Find verified, background-checked caregivers for your loved ones.
            No agency contracts. Pay only for the hours you need.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup?role=PROVIDER&type=PRIVATE"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 py-4 rounded-xl text-base shadow-lg shadow-violet-600/20 transition-all"
            >
              Find a Caregiver
              <ArrowRight size={18} />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-base transition-colors"
            >
              See how it works
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-sm font-semibold text-violet-600 uppercase tracking-wider mb-3">
              Why Families Choose ShiftCare
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Care You Can Count On
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-slate-50 rounded-2xl border border-slate-100 p-6 hover:shadow-lg transition-shadow"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${f.iconBg} flex items-center justify-center mb-4`}
                >
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-28 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-sm font-semibold text-violet-400 uppercase tracking-wider mb-3">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Three Steps to Quality Care
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.number} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-5 text-xl font-bold text-white">
                  {s.number}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Caregivers */}
      <section className="py-20 sm:py-28 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-sm font-semibold text-violet-600 uppercase tracking-wider mb-3">
              Meet Our Caregivers
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Experienced, Verified Professionals
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {SAMPLE_CAREGIVERS.map((c) => (
              <div
                key={c.name}
                className="bg-slate-50 rounded-2xl border border-slate-100 p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div
                  className={`w-16 h-16 rounded-full ${c.color} flex items-center justify-center mx-auto mb-4`}
                >
                  <span className="text-lg font-bold text-white">
                    {c.initials}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {c.name}
                </h3>
                <p className="text-sm text-violet-600 font-semibold mt-1">
                  {c.role}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {c.years} years experience
                </p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Star size={14} className="text-amber-400" fill="currentColor" />
                  <span className="text-sm font-semibold text-slate-700">
                    {c.rating}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">{c.city}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hourly Rate Ranges */}
      <section className="py-16 px-4 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-lg font-bold text-slate-900 mb-6">
            Transparent Hourly Rates
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { role: "HHA", range: "$18-24/hr", color: "text-rose-600 bg-rose-50 border-rose-200" },
              { role: "CNA", range: "$22-30/hr", color: "text-blue-600 bg-blue-50 border-blue-200" },
              { role: "Companion", range: "$15-20/hr", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
            ].map((r) => (
              <span
                key={r.role}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-semibold ${r.color}`}
              >
                {r.role}: {r.range}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Rates vary by location, experience, and time of day.
          </p>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: <ShieldCheck size={14} />, label: "HIPAA Compliant" },
            { icon: <Building2 size={14} />, label: "Licensed & Insured" },
            { icon: <CheckCircle size={14} />, label: "Background Checked" },
            { icon: <Heart size={14} />, label: "Family Trusted" },
            { icon: <UserCheck size={14} />, label: "Credential Verified" },
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
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28 px-4 bg-gradient-to-b from-white to-violet-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Your Loved One Deserves the Best Care
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            Find a verified caregiver today. No contracts, no commitments.
          </p>
          <div className="mt-8">
            <Link
              href="/signup?role=PROVIDER&type=PRIVATE"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 py-4 rounded-xl text-base shadow-lg shadow-violet-600/20 transition-all"
            >
              Find a Caregiver
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  );
}
