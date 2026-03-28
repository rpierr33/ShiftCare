"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield,
  Clock,
  Lock,
  Zap,
  ArrowRight,
  CheckCircle,
  Users,
  Calendar,
  MapPin,
  Star,
  ChevronRight,
  Check,
  Search,
  Activity,
  Building2,
  UserCheck,
  Menu,
  X,
} from "lucide-react";
import { PublicNav } from "@/components/shared/public-nav";
import { PublicFooter } from "@/components/shared/public-footer";
import { FAQSection } from "@/components/shared/faq-section";
import { TestimonialsSection } from "@/components/shared/testimonials-section";

/* ─── Shift Fulfillment Data ─── */
const SHIFT_DATA = [
  {
    role: "RN",
    location: "Tampa, FL",
    rate: "$38/hr",
    time: "7AM-3PM Tomorrow",
    workers: [
      { initials: "MG", color: "bg-rose-400" },
      { initials: "JW", color: "bg-blue-400" },
      { initials: "AP", color: "bg-amber-400" },
    ],
    accepted: { name: "Maria G.", title: "CNA", exp: "4yr exp", rating: "4.9" },
    fillTime: "8 minutes",
  },
  {
    role: "CNA",
    location: "Orlando, FL",
    rate: "$26/hr",
    time: "3PM-11PM Today",
    workers: [
      { initials: "DL", color: "bg-violet-400" },
      { initials: "KR", color: "bg-emerald-400" },
      { initials: "TN", color: "bg-cyan-400" },
    ],
    accepted: { name: "Derek L.", title: "CNA", exp: "6yr exp", rating: "4.8" },
    fillTime: "5 minutes",
  },
  {
    role: "LPN",
    location: "St. Petersburg, FL",
    rate: "$32/hr",
    time: "11PM-7AM Tonight",
    workers: [
      { initials: "SR", color: "bg-pink-400" },
      { initials: "BM", color: "bg-teal-400" },
      { initials: "CJ", color: "bg-orange-400" },
    ],
    accepted: { name: "Sandra R.", title: "LPN", exp: "3yr exp", rating: "4.7" },
    fillTime: "11 minutes",
  },
];

const TICKER_ITEMS = [
  "CNA shift filled in Tampa · 12 min ago",
  "RN accepted shift in Orlando · 3 min ago",
  "New LPN available in Clearwater",
  "3 shifts filled in the last hour",
  "CNA shift filled in St. Petersburg · 8 min ago",
  "RN posted in Jacksonville · just now",
];

/* ─── Shift Fulfillment Machine ─── */
function ShiftFulfillmentEngine() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [phase, setPhase] = useState(0); // 0=posted, 1=matching, 2=accepted, 3=confirmed
  const [shiftIndex, setShiftIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Check reduced motion preference on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mq.matches) {
        setPrefersReducedMotion(true);
        setPhase(3);
        setProgress(100);
      }
    }
  }, []);

  const shift = SHIFT_DATA[shiftIndex];

  useEffect(() => {
    if (prefersReducedMotion) return;
    const interval = setInterval(() => {
      setPhase((prev) => {
        if (prev >= 3) {
          setShiftIndex((si) => (si + 1) % SHIFT_DATA.length);
          setProgress(0);
          return 0;
        }
        return prev + 1;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  useEffect(() => {
    const progressMap = [12, 50, 75, 100];
    setProgress(progressMap[phase]);
  }, [phase]);

  const phaseLabels = ["SHIFT POSTED", "MATCHING", "ACCEPTED", "CONFIRMED"];
  const phaseColors = [
    "text-blue-400",
    "text-amber-400",
    "text-emerald-400",
    "text-emerald-400",
  ];
  const phaseDotBgActive = [
    "bg-blue-400",
    "bg-amber-400",
    "bg-emerald-400",
    "bg-emerald-400",
  ];

  return (
    <div className="bg-slate-950 rounded-2xl shadow-2xl shadow-black/40 p-6 ring-1 ring-white/10 overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-[0.15em]">
            Fulfillment Engine
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity size={12} className="text-slate-600" />
          <span className="text-[10px] text-slate-600 font-mono">LIVE</span>
        </div>
      </div>

      {/* Phase dots — all 4 always visible, active one highlighted */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5">
          {phaseLabels.map((_, i) => (
            <span
              key={i}
              className={`inline-flex rounded-full transition-all duration-500 ${
                i === phase
                  ? `h-2.5 w-2.5 ${phaseDotBgActive[phase]} shadow-sm shadow-current`
                  : i < phase
                  ? `h-2 w-2 ${phaseDotBgActive[i]} opacity-40`
                  : "h-2 w-2 bg-white/10"
              }`}
            />
          ))}
        </div>
        <span
          className={`text-xs font-bold uppercase tracking-wider transition-colors duration-500 ${phaseColors[phase]}`}
        >
          {phaseLabels[phase]}
        </span>
      </div>

      {/* Shift card */}
      <div
        className={`rounded-xl p-4 mb-4 border transition-all duration-700 ${
          phase === 3
            ? "bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/10"
            : phase === 0
            ? "bg-blue-500/10 border-blue-500/20 shadow-lg shadow-blue-500/10"
            : "bg-white/5 border-white/10"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-white">
              {shift.role} <span className="text-slate-500">·</span>{" "}
              <span className="text-slate-300 font-medium">{shift.location}</span>{" "}
              <span className="text-slate-500">·</span>{" "}
              <span className="text-cyan-400 font-bold">{shift.rate}</span>
            </span>
            <p className="text-xs text-slate-500 mt-1">{shift.time}</p>
          </div>
          <div
            className="flex-shrink-0 transition-opacity duration-500"
            style={{ opacity: phase === 3 ? 1 : 0 }}
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check size={16} className="text-white" strokeWidth={3} />
            </div>
          </div>
        </div>
      </div>

      {/* Workers section — crossfade between phase content */}
      <div className="mb-4 min-h-[72px] relative">
        {/* Phase 0: Broadcasting */}
        <div
          className="transition-opacity duration-500 absolute inset-0"
          style={{ opacity: phase === 0 ? 1 : 0, pointerEvents: phase === 0 ? "auto" : "none" }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <p className="text-xs text-slate-500">
              Broadcasting to available workers...
            </p>
          </div>
        </div>

        {/* Phase 1-3: Workers + text */}
        <div
          className="transition-opacity duration-500"
          style={{ opacity: phase >= 1 ? 1 : 0, pointerEvents: phase >= 1 ? "auto" : "none" }}
        >
          <div className="space-y-3">
            {/* Worker avatars */}
            <div className="flex items-center gap-2">
              {shift.workers.map((w, i) => (
                <div
                  key={w.initials}
                  className="transition-all duration-500"
                  style={{
                    opacity: phase === 1 ? 1 : phase >= 2 && i === 0 ? 1 : 0.3,
                    transform:
                      phase >= 1
                        ? "translateX(0) scale(1)"
                        : "translateX(-20px) scale(0.8)",
                    transitionDelay: `${i * 150}ms`,
                  }}
                >
                  <div
                    className={`relative w-10 h-10 rounded-full ${w.color} flex items-center justify-center text-xs font-bold text-white transition-all duration-500 ${
                      phase >= 2 && i === 0
                        ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950"
                        : ""
                    }`}
                  >
                    {w.initials}
                    {phase >= 2 && i === 0 && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check size={10} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Scanning line effect — crossfade */}
              <div
                className="ml-2 flex items-center gap-1.5 transition-opacity duration-500"
                style={{ opacity: phase === 1 ? 1 : 0 }}
              >
                <Search size={12} className="text-amber-400 animate-pulse" />
                <span className="text-[11px] text-amber-400 font-medium">
                  Scanning...
                </span>
              </div>
            </div>

            {/* Phase text — crossfade between states */}
            <div className="relative min-h-[18px]">
              <p
                className="text-xs text-slate-400 absolute inset-0 transition-opacity duration-500"
                style={{ opacity: phase === 1 ? 1 : 0 }}
              >
                Matching{" "}
                <span className="text-amber-400 font-semibold">
                  3 qualified workers
                </span>
                ...
              </p>
              <p
                className="text-xs text-slate-400 absolute inset-0 transition-opacity duration-500"
                style={{ opacity: phase === 2 ? 1 : 0 }}
              >
                <span className="text-emerald-400 font-semibold">
                  {shift.accepted.name}
                </span>{" "}
                accepted · {shift.accepted.title} ·{" "}
                {shift.accepted.exp} ·{" "}
                <span className="text-amber-300">&#9733;</span>{" "}
                {shift.accepted.rating}
              </p>
              <p
                className="text-xs text-emerald-400 font-semibold absolute inset-0 transition-opacity duration-500"
                style={{ opacity: phase === 3 ? 1 : 0 }}
              >
                Shift filled in {shift.fillTime}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">
            Pipeline
          </span>
          <span className="text-[10px] text-slate-600 font-mono">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              progress === 100 ? "bg-emerald-500" : "bg-cyan-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Phase steps */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        {["Posted", "Match", "Accept", "Done"].map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-500 ${
                i <= phase
                  ? i === phase
                    ? "bg-cyan-500 text-white scale-110"
                    : "bg-cyan-500/30 text-cyan-400"
                  : "bg-white/5 text-slate-600"
              }`}
            >
              {i < phase ? (
                <Check size={9} strokeWidth={3} />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-[9px] font-medium transition-colors duration-500 ${
                i <= phase ? "text-slate-400" : "text-slate-700"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Animated Counter Hook ─── */
function useCountUp(target: number, duration: number = 1000, start: boolean = true) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    if (!start) {
      setCount(0);
      return;
    }

    // Check reduced motion preference
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Check sessionStorage for already-played animation
    const storageKey = `counter-played-${target}`;
    const alreadyPlayed =
      typeof window !== "undefined" &&
      sessionStorage.getItem(storageKey) === "true";

    if (prefersReducedMotion || alreadyPlayed) {
      setCount(target);
      hasPlayedRef.current = true;
      return;
    }

    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        // Mark animation as played in sessionStorage
        try {
          sessionStorage.setItem(storageKey, "true");
        } catch {
          // sessionStorage may be unavailable
        }
        hasPlayedRef.current = true;
      }
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, start]);

  return count;
}

/* ─── Live Counter (ticks up slowly) ─── */
function LiveShiftCounter() {
  const [count, setCount] = useState(2847);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => c + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-2.5 bg-slate-900 border border-slate-800 rounded-full px-5 py-2 mb-6">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-sm font-mono font-bold text-emerald-400">
        {count.toLocaleString()}
      </span>
      <span className="text-sm text-slate-400 font-medium">shifts filled</span>
    </div>
  );
}

/* ─── Scrolling Ticker ─── */
function ActivityTicker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="w-full overflow-hidden bg-slate-950/60 backdrop-blur border-t border-b border-white/5 py-3">
      <div className="ticker-track flex items-center gap-8 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-2 text-sm">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
            <span className="text-slate-400">{item}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Animated Stat ─── */
function AnimatedStat({
  value,
  suffix,
  prefix,
  label,
  showDivider,
}: {
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
  showDivider: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const animated = useCountUp(value, 1200, visible);

  return (
    <div ref={ref} className={`text-center ${showDivider ? "stat-divider" : ""}`}>
      <div className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight font-mono">
        {prefix}
        {visible
          ? String(animated).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          : "0"}
        {suffix}
      </div>
      <div className="text-sm text-slate-500 mt-1 font-medium">{label}</div>
    </div>
  );
}

/* ─── Mobile Nav Menu ─── */
function MobileNavMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, close]);

  return (
    <div ref={menuRef} className="md:hidden relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open navigation menu"
        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
          <a
            href="#how-it-works"
            onClick={close}
            className="block px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            How It Works
          </a>
          <Link
            href="/pricing"
            onClick={close}
            className="block px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            onClick={close}
            className="block px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Sign In
          </Link>
          <div className="px-4 pt-2 pb-1">
            <Link
              href="/signup"
              onClick={close}
              className="block text-center text-sm font-semibold bg-cyan-600 text-white px-4 py-2.5 rounded-xl hover:bg-cyan-700 transition-all"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          animation: ticker-scroll 30s linear infinite;
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
            background: repeating-linear-gradient(90deg, #06b6d4 0, #06b6d4 6px, transparent 6px, transparent 12px);
          }
          .step-connector:last-child::after {
            display: none;
          }
        }
        .hero-gradient {
          background: radial-gradient(ellipse 80% 60% at 50% 40%, rgba(8,145,178,0.08) 0%, rgba(248,250,252,0.5) 60%, white 100%);
        }
      `}</style>

      {/* ─── Navigation ─── */}
      <PublicNav currentPage="home" />

      {/* ─── Hero Section ─── */}
      <section className="hero-gradient pt-28 pb-0 sm:pt-36 sm:pb-0 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-5 gap-12 lg:gap-10 items-center pb-12 sm:pb-16">
          {/* Left: Copy — takes 3 of 5 columns */}
          <div className="lg:col-span-3">
            <div className="inline-flex items-center gap-4 flex-wrap text-sm text-slate-500 mb-6">
              <span className="font-semibold text-slate-700">2,400+ Shifts Filled</span>
              <span className="text-slate-300">|</span>
              <span className="font-semibold text-slate-700">500+ Healthcare Workers</span>
              <span className="text-slate-300">|</span>
              <span className="font-semibold text-slate-700">120+ Employers</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] text-slate-900">
              Fill Open Shifts
              <br />
              in{" "}
              <span className="bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent">
                Hours, Not Days
              </span>
            </h1>

            {/* Split Hero — Three-sided value prop */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Agency Column */}
              <div className="bg-teal-50 border-l-4 border-teal-600 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-5 w-5 text-teal-600" />
                  <h2 className="text-sm font-bold text-teal-800 uppercase tracking-wide">
                    For Employers
                  </h2>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-4">
                  Post a shift in 2 minutes.
                  <br />
                  Get matched instantly.
                </p>
                <Link
                  href="/signup?role=PROVIDER&type=AGENCY"
                  className="inline-flex items-center gap-2 bg-teal-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-teal-700 transition-all text-sm shadow-lg shadow-teal-600/20 hover:shadow-teal-600/30 hover:-translate-y-0.5"
                >
                  Post a Shift
                  <ArrowRight size={16} />
                </Link>
              </div>

              {/* Private Payer Column */}
              <div className="bg-violet-50 border-l-4 border-violet-500 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-violet-600" />
                  <h2 className="text-sm font-bold text-violet-800 uppercase tracking-wide">
                    For Families
                  </h2>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-4">
                  Find trusted care for a loved one.
                  <br />
                  No subscription needed.
                </p>
                <Link
                  href="/signup?role=PROVIDER&type=PRIVATE"
                  className="inline-flex items-center gap-2 bg-violet-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-violet-700 transition-all text-sm shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 hover:-translate-y-0.5"
                >
                  Hire a Caregiver
                  <ArrowRight size={16} />
                </Link>
              </div>

              {/* Worker Column */}
              <div className="bg-slate-50 border-l-4 border-slate-400 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="h-5 w-5 text-slate-600" />
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                    For Workers
                  </h2>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  Employer and private shifts.
                  <br />
                  Work when you want.
                </p>
                <Link
                  href="/signup?role=WORKER"
                  className="inline-flex items-center gap-2 bg-slate-700 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-all text-sm shadow-lg shadow-slate-700/20 hover:shadow-slate-700/30 hover:-translate-y-0.5"
                >
                  Find Work
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Mobile-only simplified shift card */}
            <div className="mt-6 lg:hidden">
              <div className="bg-slate-950 rounded-xl p-4 ring-1 ring-white/10 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                        Confirmed
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white">
                      RN <span className="text-slate-500">·</span>{" "}
                      <span className="text-slate-300 font-medium">Tampa, FL</span>{" "}
                      <span className="text-slate-500">·</span>{" "}
                      <span className="text-cyan-400 font-bold">$38/hr</span>
                    </p>
                    <p className="text-xs text-emerald-400 font-semibold mt-1">
                      Shift filled in 8 minutes
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Check size={16} className="text-white" strokeWidth={3} />
                  </div>
                </div>
              </div>
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
                  120+ healthcare employers
                </span>{" "}
                across Florida
              </p>
            </div>
          </div>

          {/* Right: Shift Fulfillment Engine */}
          {/* Right: Graphic — takes 2 of 5 columns */}
          <div className="hidden lg:block lg:col-span-2">
            <ShiftFulfillmentEngine />
          </div>
        </div>

        {/* Activity Ticker */}
        <ActivityTicker />
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 lg:gap-0">
            <AnimatedStat value={2400} suffix="+" label="Shifts Filled" showDivider={true} />
            <AnimatedStat value={500} suffix="+" label="Healthcare Workers" showDivider={true} />
            <AnimatedStat value={120} suffix="+" label="Employers" showDivider={true} />
            <AnimatedStat value={30} suffix=" min" label="Avg Fill Time" prefix="<" showDivider={false} />
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section
        id="how-it-works"
        className="py-20 sm:py-28 px-4 bg-white scroll-mt-20"
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
              icon={<Shield size={24} className="text-cyan-400" />}
              iconBg="bg-cyan-400/10"
              title="Verified Professionals"
              description="Every worker is credentialed and background-checked before they see a single shift."
            />
            <TrustCard
              icon={<Clock size={24} className="text-emerald-400" />}
              iconBg="bg-emerald-400/10"
              title="Shifts Filled Fast"
              description="Average fill time under 30 minutes. Urgent shifts often get matched in under 10 minutes."
            />
            <TrustCard
              icon={<Lock size={24} className="text-amber-400" />}
              iconBg="bg-amber-400/10"
              title="HIPAA Compliant"
              description="Healthcare-grade security. Your data is encrypted, audited, and fully compliant."
            />
            <TrustCard
              icon={<Zap size={24} className="text-violet-400" />}
              iconBg="bg-violet-400/10"
              title="Real-Time Matching"
              description="Workers are matched and notified the moment you post. No waiting, no phone tag."
            />
          </div>

          {/* Trust / Compliance Badges */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: <Shield size={14} className="text-cyan-400" />, label: "HIPAA Compliant" },
              { icon: <Lock size={14} className="text-cyan-400" />, label: "Secure Payments via Stripe" },
              { icon: <UserCheck size={14} className="text-cyan-400" />, label: "Background Checked Workers" },
              { icon: <CheckCircle size={14} className="text-cyan-400" />, label: "Licensed & Insured" },
            ].map((badge) => (
              <span
                key={badge.label}
                className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium px-3.5 py-2 rounded-full"
              >
                {badge.icon}
                {badge.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Service Area ─── */}
      <section className="py-20 sm:py-28 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-sm font-semibold text-cyan-600 uppercase tracking-wider mb-3">
              Service Area
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
              Currently Available In
            </h2>
            <p className="text-slate-500 text-lg mt-4 max-w-xl mx-auto leading-relaxed">
              Serving healthcare agencies and workers across Florida.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {["Tampa", "Orlando", "Miami", "Jacksonville", "St. Petersburg", "Fort Lauderdale", "Clearwater", "Gainesville"].map((city) => (
              <div
                key={city}
                className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
              >
                <MapPin size={16} className="text-cyan-600 shrink-0" />
                <span className="text-sm font-medium text-slate-700">{city}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-slate-400 text-sm mt-8 font-medium">
            Expanding to Georgia, Texas, and California in 2026
          </p>
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
              Subscribe to remove per-shift fees. Workers always free.
              No credit card required to start.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <PricingCard
              name="Free"
              price="$0"
              period=""
              description="3 shifts/month"
              highlight={false}
            />
            <PricingCard
              name="Starter"
              price="$49"
              period="/mo"
              description="25 shifts/month"
              highlight={true}
            />
            <PricingCard
              name="Professional"
              price="$149"
              period="/mo"
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

      {/* ─── Testimonials ──��� */}
      <TestimonialsSection />

      {/* ─── FAQ ─── */}
      <FAQSection />

      {/* ─── Final CTA ─── */}
      <section className="py-20 sm:py-28 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Ready to Fill Shifts Faster?
          </h2>
          <p className="text-slate-500 text-lg mt-4 max-w-xl mx-auto leading-relaxed">
            Whether you run a healthcare business or need care for a loved one,
            ShiftCare connects you with qualified healthcare professionals.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup?role=PROVIDER"
              className="inline-flex items-center gap-2.5 bg-cyan-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-cyan-700 transition-all text-base shadow-lg shadow-cyan-600/25 hover:shadow-xl hover:shadow-cyan-600/30 hover:-translate-y-0.5"
            >
              I Need to Hire
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
      <PublicFooter />
    </div>
  );
}

/* ─── How It Works Tabs ─── */

function HowItWorksTabs() {
  const [activeTab, setActiveTab] = useState<"employers" | "families" | "workers">(
    "employers"
  );

  const employerSteps = [
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

  const familySteps = [
    {
      number: 1,
      title: "Tell Us What You Need",
      description:
        "Describe the care your loved one needs — role, schedule, and location. No paperwork required.",
      icon: <Calendar size={22} className="text-violet-600" />,
    },
    {
      number: 2,
      title: "Get Matched",
      description:
        "We connect you with verified, background-checked caregivers in your area.",
      icon: <Users size={22} className="text-violet-600" />,
    },
    {
      number: 3,
      title: "Care Delivered",
      description:
        "A caregiver accepts, arrives on time, and you only pay for completed care.",
      icon: <CheckCircle size={22} className="text-violet-600" />,
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
        "Apply with one tap. Get confirmed fast \u2014 no phone tag, no waiting around.",
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

  const steps = activeTab === "employers" ? employerSteps : activeTab === "families" ? familySteps : workerSteps;

  return (
    <div>
      <div className="flex justify-center mb-14">
        <div className="inline-flex bg-slate-100 rounded-full p-1">
          <button
            onClick={() => setActiveTab("employers")}
            className={`px-7 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === "employers"
                ? "bg-white text-cyan-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            For Employers
          </button>
          <button
            onClick={() => setActiveTab("families")}
            className={`px-7 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === "families"
                ? "bg-white text-violet-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            For Families
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
              <h3 className="font-bold text-lg text-slate-900">
                {step.title}
              </h3>
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
