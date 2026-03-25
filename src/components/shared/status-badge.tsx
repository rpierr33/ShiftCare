"use client";

import { Loader2, CheckCircle, Clock, XCircle, Circle, Radio, ShieldCheck } from "lucide-react";

type ShiftState = "OPEN" | "MATCHING" | "PENDING" | "ASSIGNED" | "COMPLETED" | "CANCELLED";

const STATUS_CONFIG: Record<ShiftState, {
  label: string;
  sublabel: string;
  bg: string;
  text: string;
  ring: string;
  dot: string;
  Icon: typeof CheckCircle;
  animate?: boolean;
}> = {
  OPEN: {
    label: "Open",
    sublabel: "Available now",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    ring: "ring-cyan-200",
    dot: "bg-cyan-500",
    Icon: Radio,
    animate: true,
  },
  MATCHING: {
    label: "Matching",
    sublabel: "Finding workers...",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    ring: "ring-indigo-200",
    dot: "bg-indigo-500",
    Icon: Loader2,
    animate: true,
  },
  PENDING: {
    label: "Pending",
    sublabel: "Awaiting confirmation",
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    dot: "bg-amber-500",
    Icon: Clock,
  },
  ASSIGNED: {
    label: "Assigned",
    sublabel: "Worker confirmed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    dot: "bg-emerald-500",
    Icon: CheckCircle,
  },
  COMPLETED: {
    label: "Completed",
    sublabel: "Shift finished",
    bg: "bg-slate-100",
    text: "text-slate-600",
    ring: "ring-slate-200",
    dot: "bg-slate-400",
    Icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    sublabel: "No longer active",
    bg: "bg-red-50",
    text: "text-red-600",
    ring: "ring-red-200",
    dot: "bg-red-500",
    Icon: XCircle,
  },
};

interface StatusBadgeProps {
  status: string;
  variant?: "badge" | "pill" | "full";
  showSublabel?: boolean;
  className?: string;
}

export function StatusBadge({ status, variant = "badge", showSublabel = false, className = "" }: StatusBadgeProps) {
  const key = (status === "OPEN" ? "OPEN" : status) as ShiftState;
  const config = STATUS_CONFIG[key] || STATUS_CONFIG.OPEN;
  const { label, sublabel, bg, text, ring, dot, Icon, animate } = config;

  if (variant === "pill") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${bg} ${text} ring-1 ${ring} ${className}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dot} ${animate ? "animate-pulse" : ""}`} />
        {label}
      </span>
    );
  }

  if (variant === "full") {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${bg} ring-1 ${ring} ${className}`}>
        <div className="relative">
          <Icon className={`h-5 w-5 ${text} ${animate && status === "MATCHING" ? "animate-spin" : ""}`} />
          {animate && status !== "MATCHING" && (
            <span className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ${dot} animate-ping`} />
          )}
        </div>
        <div>
          <p className={`text-sm font-semibold ${text}`}>{label}</p>
          {showSublabel && <p className={`text-xs ${text} opacity-75`}>{sublabel}</p>}
        </div>
      </div>
    );
  }

  // Default "badge" variant
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${bg} ${text} ring-1 ${ring} ${className}`}>
      <Icon className={`h-3.5 w-3.5 ${animate && status === "MATCHING" ? "animate-spin" : ""}`} />
      {label}
      {animate && status !== "MATCHING" && (
        <span className={`h-1.5 w-1.5 rounded-full ${dot} animate-pulse`} />
      )}
    </span>
  );
}

// Trust badges for embedding in cards
export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium text-cyan-600 ${className}`}>
      <ShieldCheck className="h-3.5 w-3.5" />
      Verified
    </span>
  );
}

export function LicenseRequiredBadge({ role, className = "" }: { role: string; className?: string }) {
  const licensed = ["RN", "LPN", "CNA"].includes(role);
  if (!licensed) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ${className}`}>
      <Circle className="h-2.5 w-2.5 fill-amber-400" />
      License required
    </span>
  );
}
