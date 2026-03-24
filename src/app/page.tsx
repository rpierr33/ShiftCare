"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Shield,
  Clock,
  Lock,
  ArrowRight,
  CheckCircle,
  Users,
  Briefcase,
  Zap,
  ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 text-gray-900">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse-dot {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }
        .animate-feed-1 { animation: fadeInUp 0.6s ease-out 0s both; }
        .animate-feed-2 { animation: fadeInUp 0.6s ease-out 1.5s both; }
        .animate-feed-3 { animation: fadeInUp 0.6s ease-out 3s both; }
        .animate-feed-4 { animation: fadeInUp 0.6s ease-out 4.5s both; }
        .pulse-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll { animation: scroll-left 20s linear infinite; }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/70 backdrop-blur-md z-50 border-b border-gray-100/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-blue-600">
            ShiftCare
          </Link>
          <div className="hidden sm:flex items-center gap-6">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              How It Works
            </a>
            <Link
              href="/pricing"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
          <div className="sm:hidden flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-20 sm:pt-36 sm:pb-28 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy + CTAs */}
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Fill Open Shifts in{" "}
              <span className="text-blue-600">Hours, Not Days</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-xl leading-relaxed">
              The fastest way to connect healthcare agencies with qualified
              nurses, aides, and caregivers. Post a shift. Get it filled.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
              <Link
                href="/signup?role=PROVIDER"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-blue-700 transition-colors text-base animate-cta-pulse-ring"
              >
                Post a Shift
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/signup?role=WORKER"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-gray-900 font-semibold px-8 py-3.5 rounded-lg border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors text-base"
              >
                Find Work
                <ArrowRight size={18} />
              </Link>
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>247 shifts filled this week</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
              <Shield size={14} className="text-gray-400" />
              <span>Trusted by 120+ healthcare agencies</span>
            </div>
          </div>

          {/* Right: Live System Preview */}
          <div className="bg-slate-900 rounded-2xl border border-slate-700 ring-1 ring-white/10 shadow-2xl shadow-blue-500/10 p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xs font-medium text-green-400 uppercase tracking-wider">
                Live
              </span>
            </div>
            <div className="space-y-4">
              <div className="animate-feed-1 flex items-start gap-3">
                <span className="mt-1.5 flex-shrink-0 h-2 w-2 rounded-full bg-blue-400"></span>
                <div>
                  <p className="text-sm text-slate-200">
                    New shift posted — <span className="text-blue-400 font-medium">RN, Tampa FL</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Just now</p>
                </div>
              </div>
              <div className="animate-feed-2 flex items-start gap-3">
                <span className="mt-1.5 flex-shrink-0 h-2 w-2 rounded-full bg-yellow-400"></span>
                <div>
                  <p className="text-sm text-slate-200">
                    <span className="text-yellow-400 font-medium">3 qualified workers</span> matched
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">2 min ago</p>
                </div>
              </div>
              <div className="animate-feed-3 flex items-start gap-3">
                <span className="mt-1.5 flex-shrink-0 h-2 w-2 rounded-full bg-green-400"></span>
                <div>
                  <p className="text-sm text-slate-200">
                    <span className="text-green-400 font-medium">Maria G.</span> accepted the shift
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">8 min ago</p>
                </div>
              </div>
              <div className="animate-feed-4 flex items-start gap-3">
                <CheckCircle size={14} className="mt-1 flex-shrink-0 text-green-400" />
                <div>
                  <p className="text-sm text-slate-200">
                    Shift confirmed in <span className="text-green-400 font-medium">12 minutes</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">12 min ago</p>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-700/50 text-center">
              <span className="text-[10px] uppercase tracking-widest text-slate-600">Powered by ShiftCare</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            Whether you need staff or want to pick up shifts, getting started
            takes minutes.
          </p>
          <HowItWorksTabs />
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-14">
            Built for Healthcare Trust
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <TrustCard
              icon={<Shield size={28} className="text-blue-600" />}
              title="Verified Professionals"
              description="Every worker is credentialed and background-checked."
            />
            <TrustCard
              icon={<Clock size={28} className="text-blue-600" />}
              title="Shifts Filled Fast"
              description="Average fill time under 4 hours."
            />
            <TrustCard
              icon={<Lock size={28} className="text-blue-600" />}
              title="HIPAA Compliant"
              description="Your data is secure and healthcare-grade."
            />
            <TrustCard
              icon={<Zap size={28} className="text-blue-600" />}
              title="Real-Time Matching"
              description="Workers are matched and notified the moment you post a shift."
            />
          </div>
        </div>
      </section>

      {/* Recent Activity Bar */}
      <section className="bg-slate-900 py-3 overflow-hidden">
        <div className="animate-scroll flex whitespace-nowrap gap-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-8 items-center">
              <span className="text-sm text-slate-400 flex items-center gap-2">
                <Zap size={12} className="text-blue-400" />
                CNA shift filled in Tampa
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-sm text-slate-400 flex items-center gap-2">
                <Zap size={12} className="text-green-400" />
                RN accepted shift in Orlando
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-sm text-slate-400 flex items-center gap-2">
                <Zap size={12} className="text-yellow-400" />
                3 new shifts posted today
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-sm text-slate-400 flex items-center gap-2">
                <Zap size={12} className="text-purple-400" />
                LPN shift confirmed in Clearwater
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-sm text-slate-400 flex items-center gap-2">
                <Zap size={12} className="text-cyan-400" />
                New HHA available in Brandon area
              </span>
              <span className="text-slate-600">•</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Start Free. Scale When Ready.
          </h2>
          <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
            Post up to 3 shifts/month free. Workers always free.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors text-base"
          >
            See Pricing
            <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-lg font-bold text-blue-600">ShiftCare</div>
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} ShiftCare. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/pricing"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── How It Works Tabs (Client Interactive) ─── */

function HowItWorksTabs() {
  const [activeTab, setActiveTab] = useState<"providers" | "workers">(
    "providers"
  );

  const providerSteps = [
    {
      number: 1,
      title: "Post",
      description:
        "Describe the role, time, location, and pay. Takes under 2 minutes.",
      icon: <Briefcase size={20} className="text-blue-600" />,
    },
    {
      number: 2,
      title: "Match",
      description:
        "We instantly match your shift with qualified, verified professionals.",
      icon: <Users size={20} className="text-blue-600" />,
    },
    {
      number: 3,
      title: "Fill",
      description:
        "A worker accepts, shows up, and you track everything from your dashboard.",
      icon: <CheckCircle size={20} className="text-blue-600" />,
    },
  ];

  const workerSteps = [
    {
      number: 1,
      title: "Browse",
      description:
        "Filter shifts by location, pay, schedule, and specialty.",
      icon: <Zap size={20} className="text-blue-600" />,
    },
    {
      number: 2,
      title: "Accept",
      description:
        "Apply with one tap. Get confirmed fast — no phone tag.",
      icon: <CheckCircle size={20} className="text-blue-600" />,
    },
    {
      number: 3,
      title: "Earn",
      description:
        "Show up, do great work, and get paid on your terms.",
      icon: <Briefcase size={20} className="text-blue-600" />,
    },
  ];

  const steps = activeTab === "providers" ? providerSteps : workerSteps;

  return (
    <div>
      <div className="flex justify-center mb-10">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("providers")}
            className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${
              activeTab === "providers"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Providers
          </button>
          <button
            onClick={() => setActiveTab("workers")}
            className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${
              activeTab === "workers"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Workers
          </button>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-8">
        {steps.map((step) => (
          <div
            key={step.number}
            className="text-center bg-white border border-gray-100 rounded-xl p-6 shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 mx-auto mb-4">
              {step.number}
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              {step.icon}
              <h4 className="font-semibold text-gray-900">{step.title}</h4>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
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
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6 text-center shadow-sm">
      <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
