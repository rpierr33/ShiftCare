import Link from "next/link";
import {
  DollarSign,
  Calendar,
  Eye,
  ShieldCheck,
  ArrowRight,
  UserPlus,
  Search,
  CheckCircle,
  Star,
  Building2,
  Stethoscope,
} from "lucide-react";
import { PublicNav } from "@/components/shared/public-nav";
import { PublicFooter } from "@/components/shared/public-footer";
import { EarningsCalculator } from "@/components/shared/earnings-calculator";

const FEATURES = [
  {
    icon: <DollarSign size={24} className="text-emerald-500" />,
    iconBg: "bg-emerald-50",
    title: "Same-Day Pay",
    description:
      "Get paid within hours of completing your shift. No more waiting two weeks for a paycheck.",
  },
  {
    icon: <Calendar size={24} className="text-cyan-500" />,
    iconBg: "bg-cyan-50",
    title: "Flexible Scheduling",
    description:
      "Pick shifts that fit your life. Work when you want, where you want. No minimum hours.",
  },
  {
    icon: <Eye size={24} className="text-amber-500" />,
    iconBg: "bg-amber-50",
    title: "Transparent Fees",
    description:
      "See your exact take-home pay before accepting any shift. No hidden deductions, no surprises.",
  },
  {
    icon: <ShieldCheck size={24} className="text-violet-500" />,
    iconBg: "bg-violet-50",
    title: "Verified Employers",
    description:
      "Every agency and employer on ShiftCare is licensed and verified. Work with confidence.",
  },
];

const STEPS = [
  {
    icon: <UserPlus size={24} className="text-white" />,
    number: "1",
    title: "Create Your Profile",
    description:
      "Sign up in 2 minutes. Add your certifications, availability, and preferred work areas.",
  },
  {
    icon: <Search size={24} className="text-white" />,
    number: "2",
    title: "Browse Shifts",
    description:
      "See available shifts in your area with pay rates, times, and locations upfront.",
  },
  {
    icon: <CheckCircle size={24} className="text-white" />,
    number: "3",
    title: "Accept & Earn",
    description:
      "Accept a shift with one tap. Show up, complete the work, and get paid the same day.",
  },
];

export default function ForWorkersPage() {
  return (
    <>
      <PublicNav />

      {/* Hero */}
      <section className="pt-28 pb-20 sm:pt-36 sm:pb-28 px-4 bg-gradient-to-b from-emerald-50 via-white to-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-4">
            For Healthcare Professionals
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-tight">
            Your Schedule.{" "}
            <span className="text-emerald-600">Your Pay.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Pick up shifts that fit your life. Get paid the same day. Join
            hundreds of CNAs, LPNs, and RNs already earning more with
            ShiftCare.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup?role=WORKER"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-4 rounded-xl text-base shadow-lg shadow-emerald-600/20 transition-all"
            >
              Start Earning Today
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/#how-it-works"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-base transition-colors"
            >
              Learn more
              <ArrowRight size={16} />
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Always free for workers. No fees to sign up.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3">
              Why Workers Choose ShiftCare
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Built for Healthcare Professionals
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
      <section className="py-20 sm:py-28 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Three Steps to Your Next Shift
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.number} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-5">
                  {s.icon}
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

      {/* Testimonial */}
      <section className="py-20 sm:py-28 px-4 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-0.5 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={20}
                className="text-amber-400"
                fill="currentColor"
              />
            ))}
          </div>
          <blockquote className="text-lg sm:text-xl text-slate-700 leading-relaxed italic">
            &ldquo;I love seeing exactly what I&apos;ll earn before accepting a
            shift. The same-day pay is a game-changer -- no more waiting two
            weeks. I&apos;ve picked up 15 extra shifts this month.&rdquo;
          </blockquote>
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center ring-2 ring-blue-200">
              <Stethoscope size={16} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900">Marcus T.</p>
              <p className="text-xs text-slate-500">
                CNA, 4 years experience
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 px-4 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: <ShieldCheck size={14} />, label: "HIPAA Compliant" },
            { icon: <Building2 size={14} />, label: "Verified Employers" },
            {
              icon: <CheckCircle size={14} />,
              label: "Background Checked Workers",
            },
            { icon: <DollarSign size={14} />, label: "Same-Day Pay Available" },
          ].map((b) => (
            <span
              key={b.label}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium px-3.5 py-2 rounded-full"
            >
              {b.icon}
              {b.label}
            </span>
          ))}
        </div>
      </section>

      {/* Preview Available Shifts */}
      <section className="py-20 sm:py-28 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3">
              Preview
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Available Shifts Near You
            </h2>
            <p className="text-slate-500 text-base mt-3">
              Here is a sample of the types of shifts posted on ShiftCare.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { role: "RN", location: "Tampa, FL", rate: "$38/hr", time: "7AM - 3PM", bg: "bg-cyan-50", border: "border-cyan-200", badge: "bg-cyan-100 text-cyan-700" },
              { role: "CNA", location: "Orlando, FL", rate: "$26/hr", time: "3PM - 11PM", bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700" },
              { role: "LPN", location: "St. Petersburg, FL", rate: "$32/hr", time: "11PM - 7AM", bg: "bg-violet-50", border: "border-violet-200", badge: "bg-violet-100 text-violet-700" },
            ].map((s) => (
              <div key={s.role} className={`${s.bg} border ${s.border} rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.badge}`}>
                    {s.role}
                  </span>
                  <span className="text-lg font-extrabold text-slate-900">{s.rate}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800">{s.location}</p>
                <p className="text-xs text-slate-500 mt-1">{s.time}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-5">
            Sample shifts -- sign up to see live postings
          </p>
          <div className="text-center mt-6">
            <Link
              href="/signup?role=WORKER"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl text-sm shadow-lg shadow-emerald-600/20 transition-all"
            >
              View Live Shifts
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section className="py-20 sm:py-28 px-4 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <EarningsCalculator />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28 px-4 bg-gradient-to-b from-white to-emerald-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Ready to Start Earning?
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            Create your free profile in 2 minutes and browse shifts today.
          </p>
          <div className="mt-8">
            <Link
              href="/signup?role=WORKER"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-4 rounded-xl text-base shadow-lg shadow-emerald-600/20 transition-all"
            >
              Start Earning Today
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  );
}
