"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  completeProviderOnboarding,
  completeWorkerOnboarding,
} from "@/actions/onboarding";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import type { WorkerRole } from "@prisma/client";

const WORKER_ROLES: { value: WorkerRole; label: string }[] = [
  { value: "RN", label: "Registered Nurse (RN)" },
  { value: "LPN", label: "Licensed Practical Nurse (LPN)" },
  { value: "CNA", label: "Certified Nursing Assistant (CNA)" },
  { value: "HHA", label: "Home Health Aide (HHA)" },
  { value: "MEDICAL_ASSISTANT", label: "Medical Assistant" },
  { value: "COMPANION", label: "Companion" },
  { value: "OTHER", label: "Other" },
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "PROVIDER" | "WORKER";
  onboardingCompleted: boolean;
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full transition-colors ${
            i + 1 <= current ? "bg-blue-600" : "bg-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!session?.user) {
    router.push("/login");
    return null;
  }

  const user = session.user as unknown as SessionUser;

  if (user.onboardingCompleted) {
    const dest =
      user.role === "PROVIDER" ? "/provider/dashboard" : "/worker/shifts";
    router.push(dest);
    return null;
  }

  if (user.role === "PROVIDER") {
    return <ProviderOnboardingForm />;
  }

  return <WorkerOnboardingForm />;
}

/* ─── Provider Onboarding ─────────────────────────────────────────── */

function ProviderOnboardingForm() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: Company info
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  // Step 2: Location
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  function handleNextStep(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await completeProviderOnboarding({
      companyName,
      phone: phone || undefined,
      description: description || undefined,
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      zipCode: zipCode || undefined,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    window.location.href = "/provider/shifts/new";
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Branding */}
        <div className="text-center mb-6">
          <span className="text-2xl font-bold text-blue-600 tracking-tight">
            ShiftCare
          </span>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <ProgressDots current={step} total={2} />
          <p className="text-center text-sm text-gray-500 mt-2">
            Step {step} of 2
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Step 1: Company Info */}
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  Set up your organization
                </h1>
                <p className="text-sm text-gray-500">
                  Tell us about your healthcare facility
                </p>
              </div>

              <form onSubmit={handleNextStep} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="companyName"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Company / Facility Name{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Sunrise Senior Care"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Phone
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of your facility..."
                    rows={3}
                    className="flex w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
                  />
                </div>

                <Button type="submit" className="w-full">
                  Next
                  <ArrowRight size={16} />
                </Button>
              </form>
            </>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  Facility Location
                </h1>
                <p className="text-sm text-gray-500">
                  Where is your facility located?
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Address
                  </label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      City
                    </label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="state"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      State
                    </label>
                    <select
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select...</option>
                      {US_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="zipCode"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    ZIP Code
                  </label>
                  <Input
                    id="zipCode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="10001"
                    maxLength={10}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep(1);
                      setError("");
                    }}
                    className="flex-1"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" loading={loading}>
                    Start Posting Shifts
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Worker Onboarding ───────────────────────────────────────────── */

function WorkerOnboardingForm() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: Professional info
  const [workerRole, setWorkerRole] = useState<WorkerRole | "">("");

  // Step 2: Location
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [phone, setPhone] = useState("");

  function handleNextStep(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!workerRole) {
      setError("Please select your role.");
      return;
    }
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!city.trim()) {
      setError("City is required.");
      setLoading(false);
      return;
    }

    if (!state) {
      setError("State is required.");
      setLoading(false);
      return;
    }

    const result = await completeWorkerOnboarding({
      workerRole: workerRole as WorkerRole,
      city,
      state,
      phone: phone || undefined,
      zipCode: zipCode || undefined,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    window.location.href = "/worker/shifts";
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Branding */}
        <div className="text-center mb-6">
          <span className="text-2xl font-bold text-blue-600 tracking-tight">
            ShiftCare
          </span>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <ProgressDots current={step} total={2} />
          <p className="text-center text-sm text-gray-500 mt-2">
            Step {step} of 2
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Step 1: Professional Info */}
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  Complete your profile
                </h1>
                <p className="text-sm text-gray-500">
                  Tell us about yourself so we can match you with the right
                  shifts
                </p>
              </div>

              <form onSubmit={handleNextStep} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="workerRole"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Your Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="workerRole"
                    value={workerRole}
                    onChange={(e) =>
                      setWorkerRole(e.target.value as WorkerRole)
                    }
                    required
                    className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select your role...</option>
                    {WORKER_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Button type="submit" className="w-full">
                  Next
                  <ArrowRight size={16} />
                </Button>
              </form>
            </>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  Your Location
                </h1>
                <p className="text-sm text-gray-500">
                  Help us find shifts near you
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      City <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="New York"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="state"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                      className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select...</option>
                      {US_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="zipCode"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    ZIP Code
                  </label>
                  <Input
                    id="zipCode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="10001"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Phone
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep(1);
                      setError("");
                    }}
                    className="flex-1"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" loading={loading}>
                    Browse Available Shifts
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
