"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  DollarSign,
  MapPin,
  Plus,
  AlertTriangle,
  Shield,
  FileText,
  ArrowRight,
  Zap,
  Loader2,
  Save,
  FolderOpen,
  Trash2,
} from "lucide-react";
import { createShift, createRecurringShifts } from "@/actions/shifts";
import { calculateShiftPayments } from "@/lib/fees";
import { Star } from "lucide-react";
import type { WorkerRole } from "@prisma/client";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const DAY_INDICES = [1, 2, 3, 4, 5, 6, 0] as const; // Mon-Sun order for display

function getRecurringDates(
  startDate: string,
  endDate: string,
  selectedDays: number[]
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return dates;
  const current = new Date(start);
  while (current <= end) {
    if (selectedDays.includes(current.getDay())) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, "0");
      const d = String(current.getDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${d}`);
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

const ROLES: { value: WorkerRole; label: string }[] = [
  { value: "RN", label: "Registered Nurse (RN)" },
  { value: "LPN", label: "Licensed Practical Nurse (LPN)" },
  { value: "CNA", label: "Certified Nursing Assistant (CNA)" },
  { value: "HHA", label: "Home Health Aide (HHA)" },
  { value: "MEDICAL_ASSISTANT", label: "Medical Assistant" },
  { value: "COMPANION", label: "Companion" },
];

// Reordered for private payers: HHA first, CNA second, Companion third
const ROLES_PRIVATE: { value: WorkerRole; label: string }[] = [
  { value: "HHA", label: "Home Health Aide (HHA)" },
  { value: "CNA", label: "Certified Nursing Assistant (CNA)" },
  { value: "COMPANION", label: "Companion" },
  { value: "RN", label: "Registered Nurse (RN)" },
  { value: "LPN", label: "Licensed Practical Nurse (LPN)" },
  { value: "MEDICAL_ASSISTANT", label: "Medical Assistant" },
];

const ROLE_LABELS: Record<string, string> = {
  RN: "Registered Nurse",
  LPN: "Licensed Practical Nurse",
  CNA: "Certified Nursing Assistant",
  HHA: "Home Health Aide",
  MEDICAL_ASSISTANT: "Medical Assistant",
  COMPANION: "Companion",
};

const PAY_RANGES: Record<string, string> = {
  RN: "$30-50/hr",
  LPN: "$25-40/hr",
  CNA: "$18-28/hr",
  HHA: "$15-25/hr",
  MEDICAL_ASSISTANT: "$18-28/hr",
  COMPANION: "$14-22/hr",
};

const REQUIREMENTS = [
  "BLS/CPR",
  "Hoyer Lift",
  "Two-Person Assist",
  "Wound Care",
  "IV Therapy",
  "Trach/Vent",
  "Bilingual Spanish",
] as const;

// ─── Shift Templates (localStorage) ─────────────────────────────
const TEMPLATES_KEY = "shiftcare_shift_templates";

type ShiftTemplate = {
  id: string;
  name: string;
  role: string;
  startTime: string;
  endTime: string;
  location: string;
  payRate: string;
  description: string;
  requirements: string[];
  isUrgent: boolean;
};

function loadTemplates(): ShiftTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTemplates(templates: ShiftTemplate[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export default function CreateShiftPage() {
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  const [step, setStep] = useState<"form" | "review" | "success">("form");
  const [postedShiftId, setPostedShiftId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLimitError, setIsLimitError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [providerType, setProviderType] = useState<"AGENCY" | "PRIVATE">("AGENCY");
  const [isSubscribed, setIsSubscribed] = useState(true);

  useEffect(() => {
    fetch("/api/agency/type")
      .then((res) => res.json())
      .then((data) => {
        if (data.providerType === "PRIVATE") setProviderType("PRIVATE");
        if (data.isSubscribed !== undefined) setIsSubscribed(data.isSubscribed);
      })
      .catch(() => {});
  }, []);

  const isPrivate = providerType === "PRIVATE";
  const activeRoles = isPrivate ? ROLES_PRIVATE : ROLES;

  const [invitePreferredFirst, setInvitePreferredFirst] = useState(false);
  const [scheduleType, setScheduleType] = useState<"one-time" | "recurring">("one-time");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [endDateRange, setEndDateRange] = useState("");
  const [postedCount, setPostedCount] = useState(0);

  // ─── Templates ──────────────────────────────────────────────────
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  useEffect(() => {
    setTemplates(loadTemplates());
  }, []);

  const [form, setForm] = useState({
    role: "CNA" as WorkerRole,
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    payRate: "",
    description: "",
    requirements: [] as string[],
    isUrgent: false,
    payCadence: "STANDARD" as "SAME_DAY" | "STANDARD",
  });

  // Prefill from URL params (duplicate shift)
  useEffect(() => {
    const role = searchParamsHook.get("role");
    const location = searchParamsHook.get("location");
    const payRate = searchParamsHook.get("payRate");
    const startTime = searchParamsHook.get("startTime");
    const endTime = searchParamsHook.get("endTime");

    if (role || location || payRate || startTime || endTime) {
      setForm((prev) => ({
        ...prev,
        ...(role ? { role: role as WorkerRole } : {}),
        ...(location ? { location } : {}),
        ...(payRate ? { payRate } : {}),
        ...(startTime ? { startTime } : {}),
        ...(endTime ? { endTime } : {}),
      }));
    }
  }, [searchParamsHook]);

  const handleLoadTemplate = useCallback((template: ShiftTemplate) => {
    setForm({
      role: template.role as WorkerRole,
      date: "",
      startTime: template.startTime,
      endTime: template.endTime,
      location: template.location,
      payRate: template.payRate,
      description: template.description,
      requirements: template.requirements,
      isUrgent: template.isUrgent,
      payCadence: "STANDARD" as "SAME_DAY" | "STANDARD",
    });
  }, []);

  const handleSaveTemplate = useCallback(() => {
    if (!templateName.trim()) return;
    const newTemplate: ShiftTemplate = {
      id: Date.now().toString(36),
      name: templateName.trim(),
      role: form.role,
      startTime: form.startTime,
      endTime: form.endTime,
      location: form.location,
      payRate: form.payRate,
      description: form.description,
      requirements: form.requirements,
      isUrgent: form.isUrgent,
    };
    const updated = [...templates, newTemplate];
    saveTemplates(updated);
    setTemplates(updated);
    setTemplateName("");
    setShowSaveTemplate(false);
  }, [templateName, form, templates]);

  const handleDeleteTemplate = useCallback((id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    saveTemplates(updated);
    setTemplates(updated);
  }, [templates]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function toggleRequirement(req: string) {
    setForm((prev) => ({
      ...prev,
      requirements: prev.requirements.includes(req)
        ? prev.requirements.filter((r) => r !== req)
        : [...prev.requirements, req],
    }));
  }

  // Calculate duration and cost
  const duration = useMemo(() => {
    if (!form.startTime || !form.endTime) return 0;
    const [sh, sm] = form.startTime.split(":").map(Number);
    const [eh, em] = form.endTime.split(":").map(Number);
    let hours = eh + em / 60 - (sh + sm / 60);
    if (hours <= 0) hours += 24; // overnight shift
    return Math.round(hours * 100) / 100;
  }, [form.startTime, form.endTime]);

  const isRecurring = scheduleType === "recurring";

  const recurringDates = useMemo(() => {
    if (!isRecurring || !form.date || !endDateRange || selectedDays.length === 0) return [];
    return getRecurringDates(form.date, endDateRange, selectedDays);
  }, [isRecurring, form.date, endDateRange, selectedDays]);

  const shiftCount = isRecurring ? recurringDates.length : 1;

  const payRate = parseFloat(form.payRate) || 0;
  const payments = useMemo(() => {
    if (!payRate || !duration) return null;
    return calculateShiftPayments(payRate, duration, isSubscribed);
  }, [payRate, duration, isSubscribed]);

  const totalCost = useMemo(() => {
    if (!payments) return null;
    return {
      perShift: payments.totalCharge,
      total: Math.round(payments.totalCharge * shiftCount * 100) / 100,
      grossPerShift: payments.grossAmount,
      grossTotal: Math.round(payments.grossAmount * shiftCount * 100) / 100,
    };
  }, [payments, shiftCount]);

  function formatTime12(time24: string): string {
    if (!time24) return "";
    const [h, m] = time24.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split("T")[0];

  function handleReview(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.date || !form.startTime || !form.endTime || !form.payRate || !form.location) {
      setError("Please fill in all required fields.");
      return;
    }
    if (payRate <= 0) {
      setError("Pay rate must be a positive number.");
      return;
    }
    if (form.date < today) {
      setError("Cannot create shifts in the past.");
      return;
    }

    if (isRecurring) {
      if (selectedDays.length === 0) {
        setError("Select at least one day of the week.");
        return;
      }
      if (!endDateRange) {
        setError("Select an end date for the recurring schedule.");
        return;
      }
      if (endDateRange < form.date) {
        setError("End date must be after the start date.");
        return;
      }
      if (recurringDates.length === 0) {
        setError("No matching dates found in the selected range. Check your day selections.");
        return;
      }
      if (recurringDates.length > 90) {
        setError("Cannot create more than 90 shifts at once. Shorten the date range.");
        return;
      }
    }

    setStep("review");
    window.scrollTo(0, 0);
  }

  async function handleSubmit() {
    if (!authorized) {
      setError("You must authorize the payment charge.");
      return;
    }

    setError(null);
    setIsLimitError(false);
    setSubmitting(true);

    if (!duration || duration <= 0) {
      setError("Invalid shift duration. Please check your start and end times.");
      setSubmitting(false);
      return;
    }

    try {
      if (isRecurring && recurringDates.length > 0) {
        // Recurring: batch create
        const result = await createRecurringShifts({
          role: form.role,
          location: form.location,
          startTime: form.startTime,
          endTime: form.endTime,
          payRate,
          dates: recurringDates,
          requirements: form.requirements,
          isUrgent: form.isUrgent,
          description: form.description || undefined,
        });

        if (!result.success) {
          const msg = result.error ?? "Failed to create shifts.";
          if (msg.toLowerCase().includes("limit") || msg.toLowerCase().includes("upgrade")) {
            setIsLimitError(true);
          }
          setError(msg);
          setSubmitting(false);
          return;
        }

        setPostedCount(result.data?.count ?? recurringDates.length);
        setPostedShiftId(null);
        setStep("success");
      } else {
        // Single shift
        const startTime = new Date(`${form.date}T${form.startTime}:00`).toISOString();
        const endDate = new Date(`${form.date}T${form.endTime}:00`);
        const startDate = new Date(`${form.date}T${form.startTime}:00`);
        if (endDate <= startDate) {
          endDate.setDate(endDate.getDate() + 1);
        }
        const endTime = endDate.toISOString();

        const result = await createShift({
          role: form.role,
          location: form.location,
          startTime,
          endTime,
          payRate,
          requirements: form.requirements,
          isUrgent: form.isUrgent,
          description: form.description || undefined,
          invitePreferredFirst,
          payCadence: form.payCadence,
        });

        if (!result.success) {
          const msg = result.error ?? "Failed to create shift.";
          if (msg.toLowerCase().includes("limit") || msg.toLowerCase().includes("upgrade")) {
            setIsLimitError(true);
          }
          setError(msg);
          setSubmitting(false);
          return;
        }

        setPostedShiftId(result.data?.id ?? null);
        setPostedCount(1);
        setStep("success");
      }
    } catch {
      setError("An unexpected error occurred.");
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors";

  // ─── Success Screen ─────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {postedCount > 1 ? `${postedCount} shifts posted successfully!` : "Your shift is live!"}
        </h1>
        <p className="text-slate-500 mb-2">
          {postedCount > 1
            ? "We're matching workers for each shift."
            : "We're matching workers now."}
        </p>
        <div className="inline-flex items-center gap-2 bg-cyan-50 text-cyan-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          Notifying qualified workers nearby...
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              setStep("form");
              setPostedShiftId(null);
              setPostedCount(0);
              setError(null);
              setScheduleType("one-time");
              setSelectedDays([]);
              setEndDateRange("");
              setInvitePreferredFirst(false);
              setForm({
                role: "" as WorkerRole,
                date: "",
                startTime: "07:00",
                endTime: "15:00",
                location: "",
                payRate: "",
                description: "",
                requirements: [] as string[],
                isUrgent: false,
                payCadence: "STANDARD" as "SAME_DAY" | "STANDARD",
              });
            }}
            className="inline-flex items-center justify-center gap-2 bg-cyan-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-cyan-700 transition-colors"
          >
            <Plus size={16} />
            Post Another Shift
          </button>
          {postedShiftId && postedCount <= 1 && (
            <Link
              href={`/agency/shifts/${postedShiftId}`}
              className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              View This Shift
              <ArrowRight size={16} />
            </Link>
          )}
          <Link
            href="/agency/shifts"
            className="inline-flex items-center justify-center gap-2 text-slate-500 font-medium px-6 py-3 rounded-xl hover:text-slate-700 transition-colors"
          >
            Go to All Shifts
          </Link>
        </div>

        {/* Save as Template */}
        <div className="mt-8 pt-6 border-t border-slate-200 max-w-md mx-auto">
          {!showSaveTemplate ? (
            <button
              onClick={() => setShowSaveTemplate(true)}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-600 transition-colors"
            >
              <Save className="h-4 w-4" />
              Save as template for future shifts
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Template name (e.g. 'Morning CNA')"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveTemplate(); }}
              />
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                className="px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => { setShowSaveTemplate(false); setTemplateName(""); }}
                className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Review Step ────────────────────────────────────────────────
  if (step === "review") {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => { setStep("form"); setError(null); }}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Edit
        </button>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {isRecurring ? `Review Your ${recurringDates.length} Shifts` : "Review Your Shift"}
        </h1>
        <p className="text-slate-500 text-sm mb-6">Confirm the details before posting.</p>

        {error && (
          <div className={`rounded-xl p-4 mb-6 ${isLimitError ? "bg-amber-50 border border-amber-200" : "bg-red-50 border border-red-200"}`}>
            <p className={`text-sm ${isLimitError ? "text-amber-800" : "text-red-800"}`}>{error}</p>
            {isLimitError && (
              <Link
                href="/agency/settings"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-800"
              >
                <Zap className="h-3.5 w-3.5" />
                Upgrade Plan
              </Link>
            )}
          </div>
        )}

        {/* Summary Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
          <div className="h-1.5 bg-gradient-to-r from-cyan-500 to-cyan-600" />
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Role</span>
              <span className="text-sm font-semibold text-slate-900">{ROLE_LABELS[form.role] ?? form.role}</span>
            </div>
            {isRecurring ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">Schedule</span>
                  <span className="text-sm font-semibold text-cyan-700">{recurringDates.length} shifts</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">Date Range</span>
                  <span className="text-sm font-medium text-slate-900">
                    {formatDate(form.date)} - {formatDate(endDateRange)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">Days</span>
                  <span className="text-sm font-medium text-slate-900">
                    {selectedDays.map((d) => DAY_LABELS[d]).join(", ")}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-2">All dates:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {recurringDates.map((d) => (
                      <span key={d} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        {formatDate(d)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Date</span>
                <span className="text-sm font-medium text-slate-900">{formatDate(form.date)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Time</span>
              <span className="text-sm font-medium text-slate-900">
                {formatTime12(form.startTime)} - {formatTime12(form.endTime)} ({duration}h)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Location</span>
              <span className="text-sm font-medium text-slate-900 text-right max-w-[250px]">{form.location}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Pay Rate</span>
              <span className="text-sm font-bold text-slate-900">${payRate.toFixed(2)}/hr</span>
            </div>
            {form.requirements.length > 0 && (
              <div className="flex items-start justify-between">
                <span className="text-sm text-slate-500">Requirements</span>
                <div className="flex flex-wrap gap-1 justify-end max-w-[250px]">
                  {form.requirements.map((req) => (
                    <span key={req} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-slate-100 text-slate-700">
                      {req}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {form.isUrgent && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Priority</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="h-3 w-3" />
                  URGENT
                </span>
              </div>
            )}
            {form.payCadence === "SAME_DAY" && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Pay Cadence</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Zap className="h-3 w-3" />
                  Same Day Pay
                </span>
              </div>
            )}
            {form.description && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-sm text-slate-500 mb-1">Description</p>
                <p className="text-sm text-slate-700">{form.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cost Preview */}
        {payments && totalCost && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6">
            <h3 className="text-sm font-semibold text-emerald-900 mb-3">Your Total Cost</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-700">
                  ${payRate.toFixed(2)}/hr x {duration}h{isRecurring ? ` x ${shiftCount} shifts` : ""}
                </span>
                <span className="text-sm text-emerald-700">
                  ${(payments.grossAmount * shiftCount).toFixed(2)}
                </span>
              </div>
              {!isSubscribed && payments.employerFee > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-700">
                    Platform fee (15%){isRecurring ? ` x ${shiftCount} shifts` : ""}
                  </span>
                  <span className="text-sm text-emerald-700">
                    ${(payments.employerFee * shiftCount).toFixed(2)}
                  </span>
                </div>
              )}
              {isRecurring && shiftCount > 1 && (
                <div className="flex items-center justify-between text-xs text-emerald-600">
                  <span>Per shift</span>
                  <span>${payments.totalCharge.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
                <span className="text-sm font-semibold text-emerald-900">Total</span>
                <span className="text-lg font-bold text-emerald-900">${totalCost.total.toFixed(2)}</span>
              </div>
              <p className="text-xs text-emerald-600">
                {!isSubscribed
                  ? "Includes 15% platform fee. Subscribe to remove this fee."
                  : "This is your only charge. No additional platform fees for subscribers."}
              </p>
            </div>
          </div>
        )}

        {/* Payment Authorization */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Shield className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isPrivate ? "text-violet-600" : "text-cyan-600"}`} />
            <p className="text-sm text-slate-700 leading-relaxed">
              {isPrivate ? (
                <>
                  By posting, you authorize ShiftCare to charge your payment method when a worker accepts.
                  {isRecurring ? (
                    <>
                      {" "}Total charge per shift:{" "}
                      <span className="font-bold text-slate-900">${payments?.grossAmount.toFixed(2) ?? "0.00"}</span>
                      {" "}({shiftCount} shifts).
                    </>
                  ) : (
                    <>
                      {" "}Total charge:{" "}
                      <span className="font-bold text-slate-900">${payments?.grossAmount.toFixed(2) ?? "0.00"}</span>.
                    </>
                  )}
                  {" "}You will not be charged until a worker accepts.
                </>
              ) : (
                <>
                  By posting {isRecurring ? `these ${shiftCount} shifts` : "this shift"}, you authorise ShiftCare to charge{" "}
                  <span className="font-bold text-slate-900">
                    ${totalCost?.total.toFixed(2) ?? payments?.totalCharge.toFixed(2) ?? "0.00"}
                  </span>{" "}
                  to your saved payment method if {isRecurring ? "workers accept" : "a worker accepts"}. Funds are held securely and released
                  to the worker only after you confirm shift completion. You will not be charged until a
                  worker accepts.
                </>
              )}
            </p>
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={authorized}
              onChange={(e) => setAuthorized(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <span className="text-sm font-medium text-slate-900">
              I understand and authorise this charge upon worker acceptance.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => { setStep("form"); setError(null); }}
            className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm"
          >
            Edit Shift
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !authorized}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm shadow-lg shadow-cyan-600/20"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isRecurring ? `Posting ${shiftCount} shifts...` : "Posting..."}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                {isRecurring ? `Post ${shiftCount} Shifts` : "Post Shift"}
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ─── Form Step ──────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/agency/shifts"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Shifts
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Post a New Shift</h1>
        <p className="text-slate-500 text-sm mt-1">
          Fill in the details below. Workers in your area will be notified.
        </p>
      </div>

      {/* Load Template */}
      {templates.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">Load from Template</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <div key={t.id} className="inline-flex items-center gap-1 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleLoadTemplate(t)}
                  className="px-3 py-1.5 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                >
                  {t.name}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTemplate(t.id)}
                  className="px-2 py-1.5 text-slate-400 hover:text-red-500 transition-colors border-l border-slate-200"
                  title="Delete template"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleReview} className="space-y-6">
        {/* Role */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-5 w-5 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Role</h2>
          </div>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className={inputClass}
          >
            {activeRoles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Date & Time */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Schedule</h2>
          </div>
          <div className="space-y-4">
            {/* Schedule Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Schedule Type</label>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setScheduleType("one-time")}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    scheduleType === "one-time"
                      ? "bg-cyan-600 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  One-time
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleType("recurring")}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    scheduleType === "recurring"
                      ? "bg-cyan-600 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Recurring
                </button>
              </div>
            </div>

            {/* Date / Date Range */}
            {isRecurring ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    min={today}
                    value={form.date}
                    onChange={handleChange}
                    onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                    className={`${inputClass} cursor-pointer`}
                  />
                </div>
                <div>
                  <label htmlFor="endDateRange" className="block text-sm font-medium text-slate-700 mb-1.5">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="endDateRange"
                    type="date"
                    min={form.date || today}
                    value={endDateRange}
                    onChange={(e) => setEndDateRange(e.target.value)}
                    onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                    className={`${inputClass} cursor-pointer`}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  min={today}
                  value={form.date}
                  onChange={handleChange}
                  onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                  className={`${inputClass} cursor-pointer`}
                />
              </div>
            )}

            {/* Days of Week (Recurring only) */}
            {isRecurring && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Repeat on <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-1.5">
                  {DAY_INDICES.map((dayIndex) => {
                    const selected = selectedDays.includes(dayIndex);
                    return (
                      <button
                        key={dayIndex}
                        type="button"
                        onClick={() =>
                          setSelectedDays((prev) =>
                            prev.includes(dayIndex)
                              ? prev.filter((d) => d !== dayIndex)
                              : [...prev, dayIndex]
                          )
                        }
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                          selected
                            ? "bg-cyan-600 text-white border-cyan-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-cyan-300"
                        }`}
                      >
                        {DAY_LABELS[dayIndex]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recurring Preview */}
            {isRecurring && form.date && endDateRange && selectedDays.length > 0 && (
              <div className={`rounded-lg p-3 ${recurringDates.length > 0 ? "bg-cyan-50 border border-cyan-200" : "bg-amber-50 border border-amber-200"}`}>
                {recurringDates.length > 0 ? (
                  <>
                    <p className="text-sm font-medium text-cyan-800 mb-1">
                      This will create {recurringDates.length} shift{recurringDates.length === 1 ? "" : "s"}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {recurringDates.slice(0, 14).map((d) => (
                        <span key={d} className="text-xs bg-white text-cyan-700 px-2 py-0.5 rounded border border-cyan-200">
                          {formatDate(d)}
                        </span>
                      ))}
                      {recurringDates.length > 14 && (
                        <span className="text-xs text-cyan-600 px-2 py-0.5">
                          +{recurringDates.length - 14} more
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-amber-700">
                    No matching dates found. Check your day selections and date range.
                  </p>
                )}
              </div>
            )}

            {/* Start/End Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-slate-700 mb-1.5">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={form.endTime}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
            {duration > 0 ? (
              <p className="text-xs text-cyan-600 font-medium">
                Duration: {duration} hours{isRecurring ? " per shift" : ""}
                {form.endTime < form.startTime && " (overnight shift)"}
              </p>
            ) : null}
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Location</h2>
          </div>
          <input
            name="location"
            type="text"
            value={form.location}
            onChange={handleChange}
            placeholder="123 Main St, Tampa, FL 33601"
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-slate-400">
            Be specific to attract nearby workers.
          </p>
        </div>

        {/* Pay Rate */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Compensation</h2>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-slate-400 text-sm font-medium">$</span>
            </div>
            <input
              name="payRate"
              type="number"
              step="0.01"
              min="0"
              value={form.payRate}
              onChange={handleChange}
              placeholder="25.00"
              className={`${inputClass} pl-7 pr-12`}
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-slate-400 text-sm">/hr</span>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Typical range for {ROLE_LABELS[form.role] ?? form.role}: {PAY_RANGES[form.role] ?? "$15-40/hr"}
          </p>

          {/* Live cost preview */}
          {payments && (
            <div className="mt-3 bg-emerald-50 rounded-lg p-3">
              <p className="text-sm font-medium text-emerald-800">
                ${payRate.toFixed(2)}/hr x {duration}h
                {isRecurring && shiftCount > 1 && ` x ${shiftCount} shifts`}
                {" = "}
                <span className="font-bold">
                  ${(payments.grossAmount * shiftCount).toFixed(2)}
                </span>{" "}
                total
              </p>
            </div>
          )}
        </div>

        {/* Same Day Pay Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-slate-900">Same Day Pay</p>
                <p className="text-xs text-slate-500">Worker gets paid within hours of shift completion. Attracts more applicants.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, payCadence: prev.payCadence === "SAME_DAY" ? "STANDARD" : "SAME_DAY" }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.payCadence === "SAME_DAY" ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.payCadence === "SAME_DAY" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </label>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Description</h2>
          </div>
          <div className="relative">
            <textarea
              name="description"
              rows={4}
              maxLength={500}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the shift, patient needs, facility type, parking instructions..."
              className={`${inputClass} resize-none`}
            />
            <span className="absolute bottom-2 right-3 text-xs text-slate-400">
              {form.description.length}/500
            </span>
          </div>
        </div>

        {/* Requirements (Agency) or Care Needs (Private) */}
        {isPrivate ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Care Needs</h2>
            </div>
            <textarea
              name="description"
              rows={4}
              maxLength={500}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe what the worker will help with (e.g., bathing, meal prep, medication reminders, companionship)"
              className={`${inputClass} resize-none`}
            />
            <span className="text-xs text-slate-400 mt-1 block text-right">
              {form.description.length}/500
            </span>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Requirements</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {REQUIREMENTS.map((req) => {
                  const checked = form.requirements.includes(req);
                  return (
                    <label
                      key={req}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                        checked
                          ? "bg-cyan-50 border-cyan-300 text-cyan-800"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRequirement(req)}
                        className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="text-sm font-medium">{req}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Urgent Toggle */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Mark as Urgent</p>
                    <p className="text-xs text-slate-500">Urgent shifts are highlighted for workers</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, isUrgent: !prev.isUrgent }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.isUrgent ? "bg-red-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.isUrgent ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>
            </div>
          </>
        )}

        {/* Invite Preferred Workers */}
        {!isRecurring && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Invite preferred workers first</p>
                  <p className="text-xs text-slate-500">4-hour exclusive window before public posting</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInvitePreferredFirst((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  invitePreferredFirst ? "bg-amber-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    invitePreferredFirst ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-600/20 text-sm"
        >
          {isRecurring && shiftCount > 1 ? `Review ${shiftCount} Shifts` : "Review Shift"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
