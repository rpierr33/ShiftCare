"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Plus,
} from "lucide-react";
import { createShift } from "@/actions/shifts";
import type { WorkerRole } from "@prisma/client";

const ROLES: { value: WorkerRole; label: string }[] = [
  { value: "RN", label: "Registered Nurse (RN)" },
  { value: "LPN", label: "Licensed Practical Nurse (LPN)" },
  { value: "CNA", label: "Certified Nursing Assistant (CNA)" },
  { value: "HHA", label: "Home Health Aide (HHA)" },
  { value: "MEDICAL_ASSISTANT", label: "Medical Assistant" },
  { value: "COMPANION", label: "Companion" },
  { value: "OTHER", label: "Other" },
];

export default function CreateShiftPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLimitError, setIsLimitError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    role: "CNA" as WorkerRole,
    title: "",
    location: "",
    date: "",
    startTime: "",
    endTime: "",
    payRate: "",
    notes: "",
  });

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLimitError(false);
    setSubmitting(true);

    try {
      if (
        !form.location ||
        !form.date ||
        !form.startTime ||
        !form.endTime ||
        !form.payRate
      ) {
        setError("Please fill in all required fields.");
        setSubmitting(false);
        return;
      }

      const startTime = new Date(
        `${form.date}T${form.startTime}:00`
      ).toISOString();
      const endTime = new Date(
        `${form.date}T${form.endTime}:00`
      ).toISOString();
      const payRate = parseFloat(form.payRate);

      if (isNaN(payRate) || payRate <= 0) {
        setError("Pay rate must be a positive number.");
        setSubmitting(false);
        return;
      }

      const result = await createShift({
        role: form.role,
        title: form.title || undefined,
        location: form.location,
        startTime,
        endTime,
        payRate,
        notes: form.notes || undefined,
      });

      if (!result.success) {
        const msg = result.error ?? "Failed to create shift.";
        if (
          msg.toLowerCase().includes("limit") ||
          msg.toLowerCase().includes("plan") ||
          msg.toLowerCase().includes("upgrade")
        ) {
          setIsLimitError(true);
        }
        setError(msg);
        setSubmitting(false);
        return;
      }

      router.push("/provider/dashboard");
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/provider/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Post a New Shift</h1>
        <p className="text-gray-500 mt-1">
          Fill in the details below. Workers in your area will be notified.
        </p>
      </div>

      {/* Plan limit alert */}
      {isLimitError && error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">{error}</p>
              <Link
                href="/provider/billing"
                className="inline-flex items-center mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Upgrade your plan to post more shifts &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* General error (non-limit) */}
      {error && !isLimitError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shift Details */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Briefcase className="h-5 w-5 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">
              Shift Details
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className={inputClass}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Title{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Night Shift CNA - Memory Care"
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  Location <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Sunrise Senior Living, 123 Main St, Austin TX"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="h-5 w-5 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">Schedule</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Date <span className="text-red-500">*</span>
              </label>
              <input
                id="date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startTime"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    Start Time <span className="text-red-500">*</span>
                  </span>
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
                <label
                  htmlFor="endTime"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    End Time <span className="text-red-500">*</span>
                  </span>
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
          </div>
        </div>

        {/* Compensation */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <DollarSign className="h-5 w-5 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">
              Compensation
            </h2>
          </div>

          <div>
            <label
              htmlFor="payRate"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Pay Rate <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-400 text-sm font-medium">$</span>
              </div>
              <input
                id="payRate"
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
                <span className="text-gray-400 text-sm">/hr</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <h2 className="text-base font-semibold text-gray-900">
              Additional Notes
            </h2>
          </div>

          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={form.notes}
            onChange={handleChange}
            placeholder="Any special requirements, certifications needed, or instructions for workers..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {submitting ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Posting Shift...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Post Shift
            </>
          )}
        </button>
      </form>
    </div>
  );
}
