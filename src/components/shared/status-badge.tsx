"use client";

import { CheckCircle, XCircle, Circle, Radio, ShieldCheck, AlertTriangle, Play } from "lucide-react";

type ShiftState = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "DISPUTED";
type PaymentState = "UNPAID" | "HELD" | "RELEASED" | "REFUNDED";

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
  ASSIGNED: {
    label: "Assigned",
    sublabel: "Worker confirmed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    dot: "bg-emerald-500",
    Icon: CheckCircle,
  },
  IN_PROGRESS: {
    label: "In Progress",
    sublabel: "Shift underway",
    bg: "bg-blue-50",
    text: "text-blue-700",
    ring: "ring-blue-200",
    dot: "bg-blue-500",
    Icon: Play,
    animate: true,
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
  DISPUTED: {
    label: "Disputed",
    sublabel: "Under review",
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    dot: "bg-amber-500",
    Icon: AlertTriangle,
  },
};

const PAYMENT_STATUS_CONFIG: Record<PaymentState, {
  label: string;
  bg: string;
  text: string;
}> = {
  UNPAID: { label: "Awaiting Booking", bg: "bg-slate-100", text: "text-slate-600" },
  HELD: { label: "Payment Held", bg: "bg-amber-50", text: "text-amber-700" },
  RELEASED: { label: "Paid Out", bg: "bg-emerald-50", text: "text-emerald-700" },
  REFUNDED: { label: "Refunded", bg: "bg-slate-100", text: "text-slate-500" },
};

interface StatusBadgeProps {
  status: string;
  variant?: "badge" | "pill" | "full";
  showSublabel?: boolean;
  className?: string;
}

export function StatusBadge({ status, variant = "badge", showSublabel = false, className = "" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as ShiftState] || STATUS_CONFIG.OPEN;
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
        <Icon className={`h-5 w-5 ${text}`} />
        <div>
          <p className={`text-sm font-semibold ${text}`}>{label}</p>
          {showSublabel && <p className={`text-xs ${text} opacity-75`}>{sublabel}</p>}
        </div>
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${bg} ${text} ring-1 ${ring} ${className}`}>
      <Icon className={`h-3.5 w-3.5`} />
      {label}
      {animate && <span className={`h-1.5 w-1.5 rounded-full ${dot} animate-pulse`} />}
    </span>
  );
}

export function PaymentStatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const config = PAYMENT_STATUS_CONFIG[status as PaymentState] || PAYMENT_STATUS_CONFIG.UNPAID;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} ${className}`}>
      {status === "HELD" && <span className="text-sm">&#128274;</span>}
      {status === "RELEASED" && <span className="text-sm">&#10004;</span>}
      {config.label}
    </span>
  );
}

export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium text-cyan-600 ${className}`}>
      <ShieldCheck className="h-3.5 w-3.5" />
      Verified
    </span>
  );
}

export function LicenseRequiredBadge({ role, className = "" }: { role: string; className?: string }) {
  const certificateRoles = ["CNA", "HHA", "MEDICAL_ASSISTANT"];
  const licenseRoles = ["RN", "LPN"];

  if (!certificateRoles.includes(role) && !licenseRoles.includes(role)) return null;

  const label = certificateRoles.includes(role) ? "Certificate required" : "License required";

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ${className}`}>
      <Circle className="h-2.5 w-2.5 fill-amber-400" />
      {label}
    </span>
  );
}

export function CredentialStatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const configs: Record<string, { label: string; bg: string; text: string }> = {
    VERIFIED: { label: "Verified", bg: "bg-emerald-50", text: "text-emerald-700" },
    PROVISIONAL: { label: "Provisional", bg: "bg-cyan-50", text: "text-cyan-700" },
    PENDING: { label: "Not Submitted", bg: "bg-slate-100", text: "text-slate-600" },
    UNSUBMITTED: { label: "Not Submitted", bg: "bg-slate-100", text: "text-slate-600" },
    EXPIRED: { label: "Expired", bg: "bg-red-50", text: "text-red-600" },
    REJECTED: { label: "Needs Attention", bg: "bg-red-50", text: "text-red-600" },
  };
  const config = configs[status] || configs.UNSUBMITTED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} ${className}`}>
      {config.label}
    </span>
  );
}
