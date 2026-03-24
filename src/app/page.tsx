"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Shield,
  Clock,
  Lock,
  Zap,
  ArrowRight,
  CheckCircle,
  Users,
  Briefcase,
  Calendar,
  MapPin,
  Star,
  ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-feed-1 { animation: fadeInUp 0.5s ease-out 0.2s both; }
        .animate-feed-2 { animation: fadeInUp 0.5s ease-out 1.4s both; }
        .animate-feed-3 { animation: fadeInUp 0.5s ease-out 2.6s both; }
        .animate-feed-4 { animation: fadeInUp 0.5s ease-out 3.8s both; }
        .pulse-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .hero-gradient {
          background: radial-gradient(ellipse 80% 60% at 50% 40%, rgba(8,145,178,0.06) 0%, rgba(248,250,252,0.5) 60%, white 100%);
        }
        .stat-divider {
          position: relative;
        }
        @media (min-width: 1024px) {
          .stat-divider::after {
            content: '';
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 1px;
            height: 40px;
            background: linear-gradient(to bottom, transparent, #e2e8f0, transparent);
          }
        }
        .step-connector {
          position: relative;
        }
        @media (min-width: 640px) {
          .step-connector::after {
            content: '';
            position: absolute;
            top: 48px;
            right: -16%;
            width: 32%;
            height: 2px;
            background: repeating-linear-gradient(90deg, #cbd5e1 0, #cbd5e1 6px, transparent 6px, transparent 12px);
          }
          .step-connector:last-child::after {
            display: none;
          }
        }
      `}</style>

      {/* ─── Navigation ─── */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-slate-900">
              Shift<span className="text-cyan-600">Care</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              How It Works
            </a>
            <Link
              href="/pricing"
              className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold bg-cyan-600 text-white px-5 py-2.5 rounded-xl hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-600/20 hover:shadow-cyan-600/30"
            >
              Get Started Free
            </Link>
          </div>
          <div className="md:hidden flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold bg-cyan-600 text-white px-4 py-2 rounded-xl"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="hero-gradient pt-28 pb-16 sm:pt-36 sm:pb-24 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-cyan-50 border border-cyan-100 rounded-full px-4 py-1.5 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-medium text-cyan-700">
                247 shifts filled this week
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] text-slate-900">
              Fill Open Shifts
              <br />
              in{" "}
              <span className="bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent">
                Hours, Not Days
              </span>
            </h1>

            <p className="mt-6 text-xl text-slate-500 max-w-2xl leading-relaxed">
              The fastest way to connect healthcare agencies with qualified
              nurses, aides, and caregivers. Post a shift. Get matched
              instantly. Move on.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
              <Link
                href="/signup?role=PROVIDER"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-cyan-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-cyan-700 transition-all text-base shadow-lg shadow-cyan-600/25 hover:shadow-xl hover:shadow-cyan-600/30 hover:-translate-y-0.5"
              >
                Post a Shift
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/signup?role=WORKER"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white text-slate-900 font-semibold px-8 py-4 rounded-xl border-2 border-slate-200 hover:border-cyan-300 hover:bg-slate-50 transition-all text-base hover:-translate-y-0.5"
              >
                Find Work
                <ArrowRight size={18} />
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-cyan-200 border-2 border-white flex items-center justify-center text-xs font-bold text-cyan-700">
                  A
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-200 border-2 border-white flex items-center justify-center text-xs font-bold text-emerald-700">
                  M
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-200 border-2 border-white flex items-center justify-center text-xs font-bold text-amber-700">
                  R
                </div>
              </div>
              <p className="text-sm text-slate-400">
                Trusted by{" "}
                <span className="text-slate-600 font-medium">
                  120+ healthcare agencies
                </span>{" "}
                across Florida
              </p>
            </div>
          </div>

          {/* Right: Live System Preview */}
          <div className="hidden lg:block">
            <div className="animate-float bg-slate-900 rounded-2xl shadow-2xl shadow-slate-900/20 p-6 ring-1 ring-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Live
                  </span>
                </div>
                <span className="text-xs text-slate-600 font-medium">
                  Real-time activity
                </span>
              </div>

              <div className="space-y-4">
                <div className="animate-feed-1 flex items-start gap-3 bg-white/5 rounded-xl p-3.5">
                  <span className="mt-1 flex-shrink-0 h-2.5 w-2.5 rounded-full bg-blue-400"></span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-200 leading-snug">
                      New shift posted &mdash;{" "}
                      <span className="text-blue-400 font-medium">
                        RN, Tampa FL
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Just now</p>
                  </div>
                </div>

                <div className="animate-feed-2 flex items-start gap-3 bg-white/5 rounded-xl p-3.5">
                  <span className="mt-1 flex-shrink-0 h-2.5 w-2.5 rounded-full bg-amber-400"></span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-200 leading-snug">
                      <span className="text-amber-400 font-medium">
                        3 qualified workers
                      </span>{" "}
                      matched
                    </p>
                    <p className="text-xs text-slate-500 mt-1">2m ago</p>
                  </div>
                </div>

                <div className="animate-feed-3 flex items-start gap-3 bg-white/5 rounded-xl p-3.5">
                  <span className="mt-1 flex-shrink-0 h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-200 leading-snug">
                      <span className="text-emerald-400 font-medium">
                        Maria G.
                      </span>{" "}
                      accepted the shift
                    </p>
                    <p className="text-xs text-slate-500 mt-1">8m ago</p>
                  </div>
                </div>

                <div className="animate-feed-4 flex items-start gap-3 bg-emerald-500/10 rounded-xl p-3.5 border border-emerald-500/20">
                  <CheckCircle
                    size={16}
                    className="mt-0.5 flex-shrink-0 text-emerald-400"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-slate-200 leading-snug">
                      Shift confirmed in{" "}
                      <span className="text-emerald-400 font-semibold">
                        12 minutes
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">12m ago</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600 font-medium">
                  Powered by ShiftCare
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
            {[
              { value: "2,400+", label: "Shifts Filled" },
              { value: "500+", label: "Healthcare Workers" },
              { value: "120+", label: "Agencies" },
              { value: "4hr", label: "Avg Fill Time" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`text-center ${i < 3 ? "stat-divider" : ""}`}
              >
                <div className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500 mt-1 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section
        id="how-it-works"
        className="py-20 sm:py-28 px-4 bg-white"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-cyan-600 uppercase tracking-wider mb-3">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
              Simple for Everyone
            </h2>
            <p className="text-slate-500 text-lg mt-4 max-w-xl mx-auto leading-relaxed">
              Whether you need staff or want to pick up shifts, getting
              started takes minutes.
            </p>
          </div>
          <HowItWorksTabs />
        </div>
      </section>

      {/* ─── Trust Section ─── */}
      <section className="py-20 sm:py-28 px-4 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">
              Why ShiftCare
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              Built for Healthcare Trust
            </h2>
            <p className="text-slate-400 text-lg mt-4 max-w-xl mx-auto leading-relaxed">
              Every feature designed around compliance, speed, and
              reliability.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <TrustCard
              icon={
                <Shield size={24} className="text-cyan-400" />
              }
              iconBg="bg-cyan-400/10"
              title="Verified Professionals"
              description="Every worker is credentialed and background-checked before they see a single shift."
            />
            <TrustCard
              icon={
                <Clock size={24} className="text-emerald-400" />
              }
              iconBg="bg-emerald-400/10"
              title="Shifts Filled Fast"
              description="Average fill time under 4 hours. Most shifts get matched in under 30 minutes."
            />
            <TrustCard
              icon={
                <Lock size={24} className="text-amber-400" />
              }
              iconBg="bg-amber-400/10"
              title="HIPAA Compliant"
              description="Healthcare-grade security. Your data is encrypted, audited, and fully compliant."
            />
            <TrustCard
              icon={
                <Zap size={24} className="text-violet-400" />
              }
              iconBg="bg-violet-400/10"
              title="Real-Time Matching"
              description="Workers are matched and notified the moment you post. No waiting, no phone tag."
            />
          </div>
        </div>
      </section>

      {/* ─── Pricing Teaser ─── */}
      <section className="py-20 sm:py-28 px-4 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-sm font-semibold text-cyan-600 uppercase tracking-wider mb-3">
              Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
              Start Free. Scale When Ready.
            </h2>
            <p className="text-slate-500 text-lg mt-4 max-w-xl mx-auto leading-relaxed">
              Post up to 3 shifts per month free. Workers always free. No
              credit card required.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <PricingCard
              name="Starter"
              price="Free"
              period=""
              description="3 shifts/month"
              highlight={false}
            />
            <PricingCard
              name="Growth"
              price="$99"
              period="/mo"
              description="25 shifts/month"
              highlight={true}
            />
            <PricingCard
              name="Enterprise"
              price="Custom"
              period=""
              description="Unlimited shifts"
              highlight={false}
            />
          </div>
          <div className="text-center mt-10">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-cyan-600 font-semibold hover:text-cyan-700 transition-colors text-base group"
            >
              See Full Pricing Details
              <ChevronRight
                size={18}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-20 sm:py-28 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Ready to Fill Shifts Faster?
          </h2>
          <p className="text-slate-500 text-lg mt-4 max-w-xl mx-auto leading-relaxed">
            Join 120+ agencies already using ShiftCare to keep their
            facilities fully staffed.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup?role=PROVIDER"
              className="inline-flex items-center gap-2.5 bg-emerald-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-emerald-700 transition-all text-base shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5"
            >
              Get Started Free
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/signup?role=WORKER"
              className="inline-flex items-center gap-2.5 text-slate-600 font-semibold px-8 py-4 rounded-xl border-2 border-slate-200 hover:border-cyan-300 hover:bg-slate-50 transition-all text-base hover:-translate-y-0.5"
            >
              I&apos;m a Healthcare Worker
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="text-lg font-bold text-white">
                Shift<span className="text-cyan-400">Care</span>
              </span>
            </div>
            <div className="flex items-center gap-8">
              <Link
                href="/pricing"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Pricing
              </Link>
              <a
                href="#how-it-works"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                How It Works
              </a>
              <Link
                href="/login"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} ShiftCare. All rights
              reserved.
            </p>
            <p className="text-xs text-slate-600">
              Made for healthcare. Built in Florida.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── How It Works Tabs ─── */

function HowItWorksTabs() {
  const [activeTab, setActiveTab] = useState<"agencies" | "workers">(
    "agencies"
  );

  const agencySteps = [
    {
      number: 1,
      title: "Post a Shift",
      description:
        "Describe the role, time, location, and pay. Takes under 2 minutes to go live.",
      icon: <Calendar size={22} className="text-cyan-600" />,
    },
    {
      number: 2,
      title: "Get Matched",
      description:
        "We instantly match your shift with qualified, verified professionals nearby.",
      icon: <Users size={22} className="text-cyan-600" />,
    },
    {
      number: 3,
      title: "Shift Filled",
      description:
        "A worker accepts, shows up, and you track everything from your dashboard.",
      icon: <CheckCircle size={22} className="text-cyan-600" />,
    },
  ];

  const workerSteps = [
    {
      number: 1,
      title: "Browse Shifts",
      description:
        "Filter by location, pay, schedule, and specialty. See only shifts that match you.",
      icon: <MapPin size={22} className="text-cyan-600" />,
    },
    {
      number: 2,
      title: "Accept Instantly",
      description:
        "Apply with one tap. Get confirmed fast -- no phone tag, no waiting around.",
      icon: <Zap size={22} className="text-cyan-600" />,
    },
    {
      number: 3,
      title: "Get Paid",
      description:
        "Show up, do great work, and get paid on your terms. Build your reputation.",
      icon: <Star size={22} className="text-cyan-600" />,
    },
  ];

  const steps = activeTab === "agencies" ? agencySteps : workerSteps;

  return (
    <div>
      <div className="flex justify-center mb-14">
        <div className="inline-flex bg-slate-100 rounded-full p-1">
          <button
            onClick={() => setActiveTab("agencies")}
            className={`px-7 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === "agencies"
                ? "bg-white text-cyan-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            For Agencies
          </button>
          <button
            onClick={() => setActiveTab("workers")}
            className={`px-7 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === "workers"
                ? "bg-white text-cyan-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            For Workers
          </button>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-8">
        {steps.map((step, i) => (
          <div
            key={`${activeTab}-${step.number}`}
            className={`step-connector relative bg-slate-50 rounded-2xl p-8 border border-slate-100 text-center transition-all hover:border-cyan-200 hover:shadow-lg hover:shadow-cyan-600/5 ${
              i < steps.length - 1 ? "sm:step-connector" : ""
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-cyan-600 flex items-center justify-center text-base font-bold text-white mx-auto mb-5">
              {step.number}
            </div>
            <div className="flex items-center justify-center gap-2 mb-3">
              {step.icon}
              <h4 className="font-bold text-lg text-slate-900">
                {step.title}
              </h4>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Trust Card ─── */

function TrustCard({
  icon,
  iconBg,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all group">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform ${iconBg}`}
      >
        {icon}
      </div>
      <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}

/* ─── Pricing Card ─── */

function PricingCard({
  name,
  price,
  period,
  description,
  highlight,
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  highlight: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-6 text-center transition-all hover:-translate-y-1 ${
        highlight
          ? "bg-cyan-600 text-white shadow-xl shadow-cyan-600/20 ring-2 ring-cyan-500"
          : "bg-white text-slate-900 border border-slate-200 shadow-sm"
      }`}
    >
      <span
        className={`text-sm font-semibold uppercase tracking-wider ${
          highlight ? "text-cyan-100" : "text-slate-400"
        }`}
      >
        {name}
      </span>
      <div className="mt-3 mb-2">
        <span
          className={`text-4xl font-bold ${
            highlight ? "text-white" : "text-slate-900"
          }`}
        >
          {price}
        </span>
        {period && (
          <span
            className={`text-base font-medium ${
              highlight ? "text-cyan-200" : "text-slate-400"
            }`}
          >
            {period}
          </span>
        )}
      </div>
      <p
        className={`text-sm ${
          highlight ? "text-cyan-100" : "text-slate-500"
        }`}
      >
        {description}
      </p>
    </div>
  );
}
