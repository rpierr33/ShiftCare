"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  completeProviderOnboarding,
  completeWorkerOnboarding,
  getProviderType,
  setUserRole,
} from "@/actions/onboarding";
import { ArrowRight, ArrowLeft, Loader2, Check, Briefcase, Calendar, Building2, Home } from "lucide-react";
import { LocationAutocomplete, WorkAreaPicker } from "@/components/shared/location-autocomplete";
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
  role: "PROVIDER" | "WORKER" | null;
  onboardingCompleted: boolean;
}

const selectClass =
  "w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors";

const textareaClass =
  "flex w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors resize-none";

/* Visual progress indicator: horizontal bar + dot indicators for multi-step forms */
function ProgressDots({ current, total }: { current: number; total: number }) {
  const progressPercent = (current / total) * 100;
  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-cyan-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {/* Dots */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i + 1 <= current ? "bg-cyan-600" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* Brief success screen shown after completing onboarding before redirect */
function CelebrationScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4 animate-[scale-in_0.3s_ease-out]">
          <Check className="h-10 w-10 text-emerald-600" strokeWidth={3} />
        </div>
        <p className="text-lg font-semibold text-gray-900">You&apos;re all set!</p>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
      {message}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-cyan-600" size={32} />
    </div>
  );
}

/* Main onboarding router — determines user role and provider type, then renders
   the appropriate onboarding form (Agency, Private, or Worker).
   Redirects completed users to their dashboard. Shows role selection for OAuth users. */
export default function OnboardingPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [providerType, setProviderType] = useState<"AGENCY" | "PRIVATE" | null>(null);
  const [providerTypeLoading, setProviderTypeLoading] = useState(false);

  const user = session?.user as unknown as SessionUser | undefined;

  useEffect(() => {
    if (user?.role === "PROVIDER") {
      setProviderTypeLoading(true);
      getProviderType()
        .then((type) => {
          setProviderType((type as "AGENCY" | "PRIVATE") ?? "AGENCY");
        })
        .finally(() => setProviderTypeLoading(false));
    }
  }, [user?.role]);

  if (status === "loading" || providerTypeLoading) {
    return <LoadingScreen />;
  }

  if (!session?.user) {
    router.push("/login");
    return null;
  }

  if (user!.onboardingCompleted) {
    const dest = user!.role === "PROVIDER" ? "/agency/dashboard" : "/worker/shifts";
    window.location.href = dest;
    return <LoadingScreen />;
  }

  // User has no role yet (Google OAuth sign-up) — show role selection first
  if (!user!.role) {
    return (
      <RoleSelectionStep
        onRoleSelected={async (role, pType) => {
          await updateSession({ role });
          if (role === "PROVIDER") {
            setProviderType(pType || "AGENCY");
          }
        }}
      />
    );
  }

  if (user!.role === "PROVIDER" && providerType === "AGENCY") {
    return <AgencyOnboardingForm />;
  }

  if (user!.role === "PROVIDER" && providerType === "PRIVATE") {
    return <PrivateEmployerOnboardingForm />;
  }

  if (user!.role === "WORKER") {
    return <WorkerOnboardingForm />;
  }

  return <LoadingScreen />;
}

/* ─── Role Selection for OAuth users without a role ────────────────�� */

/* Shown to Google OAuth users who don't have a role yet. Lets them pick
   employer (agency/private) or worker before proceeding to onboarding. */
function RoleSelectionStep({
  onRoleSelected,
}: {
  onRoleSelected: (role: "PROVIDER" | "WORKER", providerType?: "AGENCY" | "PRIVATE") => Promise<void>;
}) {
  const [step, setStep] = useState<"role" | "providerType">("role");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSelectRole(role: "PROVIDER" | "WORKER", providerType?: "AGENCY" | "PRIVATE") {
    setLoading(true);
    setError("");
    const result = await setUserRole(role, providerType);
    if (!result.success) {
      setError(result.error || "Failed to set role.");
      setLoading(false);
      return;
    }
    await onRoleSelected(role, providerType);
    setLoading(false);
  }

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-cyan-600 tracking-tight">ShiftCare</span>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm mb-6">
              {error}
            </div>
          )}

          {step === "role" && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome to ShiftCare</h1>
                <p className="text-sm text-slate-500">How will you use ShiftCare?</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  type="button"
                  onClick={() => setStep("providerType")}
                  className="relative text-left p-6 rounded-2xl border-2 bg-cyan-50 border-cyan-200 hover:border-cyan-400 transition-all duration-200"
                >
                  <Briefcase size={28} className="text-cyan-600 mb-2" />
                  <h3 className="text-lg font-bold text-slate-900 mb-1">I Need Staff</h3>
                  <p className="text-sm text-slate-500">Post shifts and find qualified healthcare workers</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRole("WORKER")}
                  className="relative text-left p-6 rounded-2xl border-2 bg-emerald-50 border-emerald-200 hover:border-emerald-400 transition-all duration-200"
                >
                  <Calendar size={28} className="text-emerald-600 mb-2" />
                  <h3 className="text-lg font-bold text-slate-900 mb-1">I&apos;m Looking for Shifts</h3>
                  <p className="text-sm text-slate-500">Browse shifts and start earning on your schedule</p>
                </button>
              </div>
            </>
          )}

          {step === "providerType" && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">What type of employer?</h1>
                <p className="text-sm text-slate-500">This determines what information we&apos;ll need</p>
              </div>

              <button
                type="button"
                onClick={() => setStep("role")}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <div className="grid grid-cols-1 gap-4">
                <button
                  type="button"
                  onClick={() => handleSelectRole("PROVIDER", "AGENCY")}
                  className="relative text-left p-6 rounded-2xl border-2 bg-cyan-50 border-cyan-200 hover:border-cyan-400 transition-all duration-200"
                >
                  <Building2 size={28} className="text-cyan-600 mb-2" />
                  <h3 className="text-base font-bold text-slate-900 mb-1">Healthcare Employer</h3>
                  <p className="text-sm text-slate-500">Licensed employer, nurse registry, or staffing organization</p>
                  <p className="text-xs text-slate-400 mt-2">Requires: NPI, EIN, license info</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRole("PROVIDER", "PRIVATE")}
                  className="relative text-left p-6 rounded-2xl border-2 bg-violet-50 border-violet-200 hover:border-violet-400 transition-all duration-200"
                >
                  <Home size={28} className="text-violet-600 mb-2" />
                  <h3 className="text-base font-bold text-slate-900 mb-1">Private Employer</h3>
                  <p className="text-sm text-slate-500">Individual or family hiring healthcare workers directly</p>
                  <p className="text-xs text-slate-400 mt-2">Quick setup -- just add payment to start posting</p>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Agency Onboarding (3 steps) ──────────────────────────────────── */

/* 3-step agency onboarding: Business Info -> License & Compliance -> Contact & Location.
   Creates a Stripe customer after completion (non-blocking) and redirects to shift creation. */
function AgencyOnboardingForm() {
  const { data: session, update: updateSession } = useSession();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Step 1: Business Info
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  // Step 2: License & Compliance
  const [npiNumber, setNpiNumber] = useState("");
  const [einNumber, setEinNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");

  // Step 3: Contact & Location
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPersonEmail, setContactPersonEmail] = useState("");
  const [contactPersonPhone, setContactPersonPhone] = useState("");

  const totalSteps = 3;

  function handleStep1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }
    setStep(2);
  }

  function handleStep2(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!npiNumber.trim()) {
      setError("NPI number is required for employer verification.");
      return;
    }
    setStep(3);
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
      npiNumber: npiNumber || undefined,
      einNumber: einNumber || undefined,
      licenseNumber: licenseNumber || undefined,
      licenseState: licenseState || undefined,
      licenseExpiryDate: licenseExpiryDate || undefined,
      contactPerson: contactPerson || undefined,
      contactPersonEmail: contactPersonEmail || undefined,
      contactPersonPhone: contactPersonPhone || undefined,
    });

    if (!result.success) {
      setError(result.error || "Failed to complete onboarding.");
      setLoading(false);
      return;
    }

    // Create Stripe customer (non-blocking)
    try {
      const { createStripeCustomer } = await import("@/lib/stripe-actions");
      const user = session?.user as unknown as SessionUser | undefined;
      if (user?.id) {
        await createStripeCustomer(user.id);
      }
    } catch (e) {
      console.error("Stripe customer creation failed (non-blocking):", e);
    }

    await updateSession({ onboardingCompleted: true });

    setShowCelebration(true);
    setTimeout(() => {
      window.location.href = "/agency/shifts/new";
    }, 1200);
  }

  if (showCelebration) return <CelebrationScreen />;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Branding */}
        <div className="text-center mb-6">
          <span className="text-2xl font-bold text-cyan-600 tracking-tight">
            ShiftCare
          </span>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <ProgressDots current={step} total={totalSteps} />
          <p className="text-center text-sm text-gray-500 mt-2">
            Step {step} of {totalSteps}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Step 1: Business Info */}
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  Business Info
                </h1>
                <p className="text-sm text-gray-500">
                  Your company name helps workers identify your organization
                </p>
              </div>

              <form onSubmit={handleStep1} className="space-y-4">
                <ErrorBanner message={error} />

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Company Name <span className="text-red-500">*</span>
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
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of your organization..."
                    rows={3}
                    className={textareaClass}
                  />
                </div>

                <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700">
                  Next
                  <ArrowRight size={16} />
                </Button>
              </form>
            </>
          )}

          {/* Step 2: License & Compliance */}
          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  License &amp; Compliance
                </h1>
                <p className="text-sm text-gray-500">
                  Required for healthcare employer verification
                </p>
              </div>

              <form onSubmit={handleStep2} className="space-y-4">
                <ErrorBanner message={error} />

                <div>
                  <label htmlFor="npiNumber" className="block text-sm font-medium text-gray-700 mb-1.5">
                    NPI Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="npiNumber"
                    value={npiNumber}
                    onChange={(e) => setNpiNumber(e.target.value)}
                    placeholder="1234567890"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="einNumber" className="block text-sm font-medium text-gray-700 mb-1.5">
                    EIN Number
                  </label>
                  <Input
                    id="einNumber"
                    value={einNumber}
                    onChange={(e) => setEinNumber(e.target.value)}
                    placeholder="12-3456789"
                  />
                </div>

                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-1.5">
                    License Number
                  </label>
                  <Input
                    id="licenseNumber"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="HCA-12345"
                  />
                </div>

                <div>
                  <label htmlFor="licenseState" className="block text-sm font-medium text-gray-700 mb-1.5">
                    License State
                  </label>
                  <select
                    id="licenseState"
                    value={licenseState}
                    onChange={(e) => setLicenseState(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select...</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="licenseExpiryDate" className="block text-sm font-medium text-gray-700 mb-1.5">
                    License Expiration Date
                  </label>
                  <Input
                    id="licenseExpiryDate"
                    type="date"
                    value={licenseExpiryDate}
                    onChange={(e) => setLicenseExpiryDate(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setStep(1); setError(""); }}
                    className="flex-1"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                    Next
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* Step 3: Contact & Location */}
          {step === 3 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  Contact &amp; Location
                </h1>
                <p className="text-sm text-gray-500">
                  Where workers will find your shifts
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <ErrorBanner message={error} />

                <div>
                  <LocationAutocomplete
                    id="address"
                    value={address}
                    onChange={setAddress}
                    onSelect={(loc) => {
                      setAddress(loc.fullAddress || loc.display);
                      if (loc.city) setCity(loc.city);
                      if (loc.state) setState(loc.state);
                      if (loc.zipCode) setZipCode(loc.zipCode);
                    }}
                    label="Address"
                    placeholder="Search address..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <LocationAutocomplete
                      id="city"
                      value={city}
                      onChange={setCity}
                      onSelect={(loc) => {
                        setCity(loc.city);
                        if (loc.state) setState(loc.state);
                        if (loc.zipCode) setZipCode(loc.zipCode);
                      }}
                      label="City"
                      placeholder="Search city..."
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1.5">
                      State
                    </label>
                    <select
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select...</option>
                      {US_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1.5">
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

                <hr className="border-gray-100" />

                <p className="text-xs text-gray-400">If the primary contact is different from the account holder:</p>

                <div>
                  <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Contact Person
                  </label>
                  <Input
                    id="contactPerson"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contactPersonEmail" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Contact Email
                    </label>
                    <Input
                      id="contactPersonEmail"
                      type="email"
                      value={contactPersonEmail}
                      onChange={(e) => setContactPersonEmail(e.target.value)}
                      placeholder="jane@company.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="contactPersonPhone" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Contact Phone
                    </label>
                    <Input
                      id="contactPersonPhone"
                      type="tel"
                      value={contactPersonPhone}
                      onChange={(e) => setContactPersonPhone(e.target.value)}
                      placeholder="(555) 987-6543"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setStep(2); setError(""); }}
                    className="flex-1"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700" loading={loading}>
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

/* ─── Private Payer Onboarding (3 steps) ───────────────────────────��─ */
/* 3-step private employer onboarding: About You -> Care Location -> Review.
   Collects patient info, care location, and creates provider profile for families. */

const RELATIONSHIPS = [
  "Parent",
  "Spouse",
  "Child",
  "Sibling",
  "Legal Guardian",
  "Self",
  "Other",
];

const AGE_RANGES = [
  "Under 18",
  "18-40",
  "41-64",
  "65-79",
  "80+",
];

function PrivateEmployerOnboardingForm() {
  const { data: session, update: updateSession } = useSession();
  const userName = (session?.user as unknown as SessionUser | undefined)?.name ?? "";
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: About You
    yourName: userName,
    phone: "",
    relationship: "",
    patientName: "",
    ageRange: "",
    // Step 2: Care Location
    address: "",
    city: "",
    state: "FL",
    zipCode: "",
    accessInstructions: "",
  });

  // Sync userName once session loads
  useEffect(() => {
    if (userName && !formData.yourName) {
      setFormData((prev) => ({ ...prev, yourName: userName }));
    }
  }, [userName, formData.yourName]);

  const totalSteps = 3;

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleStep1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!formData.phone.trim()) {
      setError("Phone number is required.");
      return;
    }
    if (!formData.relationship) {
      setError("Please select your relationship to the patient.");
      return;
    }
    if (!formData.patientName.trim()) {
      setError("Patient's first name is required.");
      return;
    }
    setStep(2);
  }

  function handleStep2(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!formData.address.trim()) {
      setError("Street address is required.");
      return;
    }
    if (!formData.city.trim()) {
      setError("City is required.");
      return;
    }
    if (!formData.zipCode.trim()) {
      setError("ZIP code is required.");
      return;
    }
    setStep(3);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const companyName = `${formData.patientName.trim()}'s Care`;
    const description = [
      `Relationship: ${formData.relationship}`,
      `Patient age range: ${formData.ageRange || "Not specified"}`,
      formData.accessInstructions ? `Access instructions: ${formData.accessInstructions}` : "",
    ].filter(Boolean).join("\n");

    const result = await completeProviderOnboarding({
      companyName,
      phone: formData.phone || undefined,
      description,
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      zipCode: formData.zipCode || undefined,
      contactPerson: formData.yourName || undefined,
    });

    if (!result.success) {
      setError(result.error || "Failed to complete onboarding.");
      setLoading(false);
      return;
    }

    // Create Stripe customer (non-blocking)
    try {
      const { createStripeCustomer } = await import("@/lib/stripe-actions");
      const user = session?.user as unknown as SessionUser | undefined;
      if (user?.id) {
        await createStripeCustomer(user.id);
      }
    } catch (e) {
      console.error("Stripe customer creation failed (non-blocking):", e);
    }

    await updateSession({ onboardingCompleted: true });

    setShowCelebration(true);
    setTimeout(() => {
      window.location.href = "/agency/dashboard";
    }, 1000);
  }

  if (showCelebration) return <CelebrationScreen />;

  const violetInputClass =
    "w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Branding */}
        <div className="text-center mb-6">
          <span className="text-2xl font-bold text-violet-600 tracking-tight">
            ShiftCare
          </span>
          <p className="text-xs text-violet-500 mt-1">Private Care</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="space-y-3">
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i + 1 <= step ? "bg-violet-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            Step {step} of {totalSteps}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Step 1: About You */}
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  About You
                </h1>
                <p className="text-sm text-gray-500">
                  Tell us about yourself and who needs care
                </p>
              </div>

              <form onSubmit={handleStep1} className="space-y-4">
                <ErrorBanner message={error} />

                <div>
                  <label htmlFor="yourName" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Your Name
                  </label>
                  <Input
                    id="yourName"
                    value={formData.yourName}
                    onChange={(e) => updateField("yourName", e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Relationship to Patient <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="relationship"
                    value={formData.relationship}
                    onChange={(e) => updateField("relationship", e.target.value)}
                    required
                    className={violetInputClass}
                  >
                    <option value="">Select...</option>
                    {RELATIONSHIPS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <hr className="border-gray-100" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Who needs care?</p>

                <div>
                  <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Patient&apos;s First Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="patientName"
                    value={formData.patientName}
                    onChange={(e) => updateField("patientName", e.target.value)}
                    placeholder="e.g. Margaret"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="ageRange" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Age Range
                  </label>
                  <select
                    id="ageRange"
                    value={formData.ageRange}
                    onChange={(e) => updateField("ageRange", e.target.value)}
                    className={violetInputClass}
                  >
                    <option value="">Select...</option>
                    {AGE_RANGES.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">
                  Next
                  <ArrowRight size={16} />
                </Button>
              </form>
            </>
          )}

          {/* Step 2: Care Location */}
          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  Care Location
                </h1>
                <p className="text-sm text-gray-500">
                  Where will the caregiver provide care?
                </p>
              </div>

              <form onSubmit={handleStep2} className="space-y-4">
                <ErrorBanner message={error} />

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="123 Main St"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ppCity" className="block text-sm font-medium text-gray-700 mb-1.5">
                      City <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="ppCity"
                      value={formData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      placeholder="Tampa"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="ppState" className="block text-sm font-medium text-gray-700 mb-1.5">
                      State
                    </label>
                    <select
                      id="ppState"
                      value={formData.state}
                      onChange={(e) => updateField("state", e.target.value)}
                      className={violetInputClass}
                    >
                      {US_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="ppZipCode" className="block text-sm font-medium text-gray-700 mb-1.5">
                    ZIP Code <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="ppZipCode"
                    value={formData.zipCode}
                    onChange={(e) => updateField("zipCode", e.target.value)}
                    placeholder="33601"
                    maxLength={10}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="accessInstructions" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Special Access Instructions
                  </label>
                  <textarea
                    id="accessInstructions"
                    value={formData.accessInstructions}
                    onChange={(e) => updateField("accessInstructions", e.target.value)}
                    placeholder="Gate code, parking info, apartment number..."
                    rows={3}
                    className={textareaClass}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setStep(1); setError(""); }}
                    className="flex-1"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700">
                    Next
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* Step 3: Review & Get Started */}
          {step === 3 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  Review &amp; Get Started
                </h1>
                <p className="text-sm text-gray-500">
                  Confirm your details below
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <ErrorBanner message={error} />

                <div className="space-y-3">
                  <div className="flex items-start justify-between p-3 rounded-xl bg-violet-50">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Your Name</p>
                      <p className="text-sm text-gray-500">{formData.yourName || "Not provided"}</p>
                    </div>
                    <button type="button" onClick={() => setStep(1)} className="text-xs text-violet-600 hover:text-violet-700 font-medium">Edit</button>
                  </div>

                  <div className="flex items-start justify-between p-3 rounded-xl bg-violet-50">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Phone</p>
                      <p className="text-sm text-gray-500">{formData.phone}</p>
                    </div>
                    <button type="button" onClick={() => setStep(1)} className="text-xs text-violet-600 hover:text-violet-700 font-medium">Edit</button>
                  </div>

                  <div className="flex items-start justify-between p-3 rounded-xl bg-violet-50">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Relationship</p>
                      <p className="text-sm text-gray-500">{formData.relationship}</p>
                    </div>
                    <button type="button" onClick={() => setStep(1)} className="text-xs text-violet-600 hover:text-violet-700 font-medium">Edit</button>
                  </div>

                  <div className="flex items-start justify-between p-3 rounded-xl bg-violet-50">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Patient</p>
                      <p className="text-sm text-gray-500">{formData.patientName}{formData.ageRange ? ` (${formData.ageRange})` : ""}</p>
                    </div>
                    <button type="button" onClick={() => setStep(1)} className="text-xs text-violet-600 hover:text-violet-700 font-medium">Edit</button>
                  </div>

                  <div className="flex items-start justify-between p-3 rounded-xl bg-violet-50">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Care Location</p>
                      <p className="text-sm text-gray-500">{formData.address}, {formData.city}, {formData.state} {formData.zipCode}</p>
                    </div>
                    <button type="button" onClick={() => setStep(2)} className="text-xs text-violet-600 hover:text-violet-700 font-medium">Edit</button>
                  </div>

                  {formData.accessInstructions && (
                    <div className="flex items-start justify-between p-3 rounded-xl bg-violet-50">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Access Instructions</p>
                        <p className="text-sm text-gray-500">{formData.accessInstructions}</p>
                      </div>
                      <button type="button" onClick={() => setStep(2)} className="text-xs text-violet-600 hover:text-violet-700 font-medium">Edit</button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-400 text-center">
                  By continuing, you agree to our Terms of Service
                </p>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setStep(2); setError(""); }}
                    className="flex-1"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700" loading={loading}>
                    Get Started
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

/* ─── Worker Onboarding (5 steps) ──────────────────────────────────── */

/* 5-step worker onboarding: Role -> Location & Work Area -> Credentials -> Contact -> Review.
   Pre-loads existing profile data for returning users. Creates worker profile on completion. */
function WorkerOnboardingForm() {
  const { update: updateSession } = useSession();
  const [step, setStep] = useState(1);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [workerRole, setWorkerRole] = useState<string>("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [phone, setPhone] = useState("");
  const [workAreasList, setWorkAreasList] = useState<string[]>([]);
  const [serviceRadius, setServiceRadius] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [certifications, setCertifications] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const totalSteps = 5;

  // Load existing profile data for returning users
  useEffect(() => {
    async function loadExisting() {
      try {
        const { getWorkerProfile } = await import("@/actions/worker");
        const profile = await getWorkerProfile();
        if (profile) {
          if (profile.workerRole) setWorkerRole(profile.workerRole);
          if (profile.city) setCity(profile.city);
          if (profile.state) setState(profile.state);
          if (profile.zipCode) setZipCode(profile.zipCode);
          if (profile.workAreas?.length) setWorkAreasList(profile.workAreas);
          if (profile.serviceRadiusMiles) setServiceRadius(String(profile.serviceRadiusMiles));
          if (profile.licenseNumber) setLicenseNumber(profile.licenseNumber);
          if (profile.licenseState) setLicenseState(profile.licenseState);
          if (profile.certifications?.length) setCertifications(profile.certifications.join(", "));
          if (profile.user?.phone) setPhone(profile.user.phone);
        }
      } catch {
        // First time — no profile yet, that's fine
      }
      setProfileLoaded(true);
    }
    loadExisting();
  }, []);

  function nextStep() {
    setError("");
    setStep((s) => Math.min(s + 1, totalSteps));
  }

  function prevStep() {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  }

  function handleStep1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!workerRole) {
      setError("Please select your role.");
      return;
    }
    nextStep();
  }

  function handleStep2(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!city.trim()) {
      setError("City is required.");
      return;
    }
    if (!state) {
      setError("State is required.");
      return;
    }
    nextStep();
  }

  function handleStep3(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    nextStep();
  }

  function handleStep4(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    nextStep();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await completeWorkerOnboarding({
      workerRole: workerRole as WorkerRole,
      city,
      state,
      zipCode: zipCode || undefined,
      phone: phone || undefined,
      workAreas: workAreasList,
      serviceRadiusMiles: serviceRadius ? parseInt(serviceRadius) : undefined,
      licenseNumber: licenseNumber || undefined,
      licenseState: licenseState || undefined,
      certifications: certifications
        ? certifications.split(",").map(c => c.trim()).filter(Boolean)
        : undefined,
    });

    if (!result.success) {
      setError(result.error || "Failed to complete onboarding.");
      setLoading(false);
      return;
    }

    // Update the JWT session so middleware knows onboarding is complete
    await updateSession({ onboardingCompleted: true });

    setShowCelebration(true);
    setTimeout(() => {
      window.location.href = "/worker/shifts";
    }, 1200);
  }

  if (showCelebration) return <CelebrationScreen />;
  if (!profileLoaded) return <LoadingScreen />;

  const roleLabel = WORKER_ROLES.find((r) => r.value === workerRole)?.label;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Branding */}
        <div className="text-center mb-6">
          <span className="text-2xl font-bold text-cyan-600 tracking-tight">
            ShiftCare
          </span>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <ProgressDots current={step} total={totalSteps} />
          <p className="text-center text-sm text-gray-500 mt-2">
            Step {step} of {totalSteps}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Step 1: Your Role */}
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  Your Role
                </h1>
                <p className="text-sm text-gray-500">
                  This determines which shifts you&apos;ll see
                </p>
              </div>

              <form onSubmit={handleStep1} className="space-y-4">
                <ErrorBanner message={error} />

                <div>
                  <label htmlFor="workerRole" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="workerRole"
                    value={workerRole}
                    onChange={(e) => setWorkerRole(e.target.value)}
                    required
                    className={selectClass}
                  >
                    <option value="">Select your role...</option>
                    {WORKER_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700">
                  Next
                  <ArrowRight size={16} />
                </Button>
              </form>
            </>
          )}

          {/* Step 2: Location & Work Area */}
          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  Location &amp; Work Area
                </h1>
                <p className="text-sm text-gray-500">
                  Tell us where you want to work
                </p>
                <p className="text-xs text-cyan-600 font-medium mt-1">
                  Location is the #1 factor in matching you with nearby shifts.
                </p>
              </div>

              <form onSubmit={handleStep2} className="space-y-4">
                <ErrorBanner message={error} />

                <div>
                  <LocationAutocomplete
                    id="city"
                    value={city}
                    onChange={setCity}
                    onSelect={(loc) => {
                      setCity(loc.city);
                      if (loc.state) setState(loc.state);
                      if (loc.zipCode) setZipCode(loc.zipCode);
                    }}
                    label="City"
                    required
                    placeholder="Search your city..."
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1.5">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                    className={selectClass}
                  >
                    <option value="">Select...</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                    onClick={prevStep}
                    className="flex-1"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                    Next
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* Step 3: Work Preferences */}
          {step === 3 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  Work Preferences
                </h1>
                <p className="text-sm text-gray-500">
                  You&apos;ll only see shifts in these areas. Leave empty to see all.
                </p>
                <p className="text-xs text-cyan-600 font-medium mt-1">
                  Setting a radius helps you see more or fewer opportunities.
                </p>
              </div>

              <form onSubmit={handleStep3} className="space-y-4">
                <ErrorBanner message={error} />

                <div>
                  <WorkAreaPicker
                    areas={workAreasList}
                    onChange={setWorkAreasList}
                    label="Work Areas"
                    placeholder="Add cities you want to work in..."
                  />
                </div>

                <div>
                  <label htmlFor="serviceRadius" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Service Radius (miles)
                  </label>
                  <Input
                    id="serviceRadius"
                    type="number"
                    min="1"
                    value={serviceRadius}
                    onChange={(e) => setServiceRadius(e.target.value)}
                    placeholder="25"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                    Next
                    <ArrowRight size={16} />
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Skip for now
                </button>
              </form>
            </>
          )}

          {/* Step 4: Credentials & License */}
          {step === 4 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  Credentials &amp; License
                </h1>
                <p className="text-sm text-gray-500">
                  Upload or enter your credentials. You have 30 days to complete verification.
                </p>
                <p className="text-xs text-cyan-600 font-medium mt-1">
                  Verified credentials unlock higher-paying shifts.
                </p>
              </div>

              <form onSubmit={handleStep4} className="space-y-4">
                <ErrorBanner message={error} />

                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm">
                  Your credentials will be verified within 30 days. You can start accepting shifts immediately while verification is in progress.
                </div>

                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {["CNA", "HHA", "MEDICAL_ASSISTANT"].includes(workerRole) ? "Certificate Number" : "License Number"}
                  </label>
                  <Input
                    id="licenseNumber"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder={["CNA", "HHA", "MEDICAL_ASSISTANT"].includes(workerRole) ? "e.g. CNA-123456" : "e.g. RN-123456"}
                  />
                </div>

                <div>
                  <label htmlFor="licenseState" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {["CNA", "HHA", "MEDICAL_ASSISTANT"].includes(workerRole) ? "Issuing State" : "License State"}
                  </label>
                  <select
                    id="licenseState"
                    value={licenseState}
                    onChange={(e) => setLicenseState(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select...</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="certifications" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Certifications
                  </label>
                  <Input
                    id="certifications"
                    value={certifications}
                    onChange={(e) => setCertifications(e.target.value)}
                    placeholder="BLS, CPR, ACLS"
                  />
                  <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                    Next
                    <ArrowRight size={16} />
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Skip for now
                </button>
              </form>
            </>
          )}

          {/* Step 5: Review & Complete */}
          {step === 5 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  Review &amp; Complete
                </h1>
                <p className="text-sm text-gray-500">
                  You can update these anytime in your profile
                </p>
                <p className="text-xs text-cyan-600 font-medium mt-1">
                  You&apos;re ready. Shifts are waiting.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <ErrorBanner message={error} />

                <div className="space-y-3">
                  {/* Role */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <span className="text-emerald-600 mt-0.5">&#10003;</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Role</p>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-xs font-medium">
                        {roleLabel}
                      </span>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <span className="text-emerald-600 mt-0.5">&#10003;</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Location</p>
                      <p className="text-sm text-gray-500">{city}, {state}</p>
                    </div>
                  </div>

                  {/* Work Areas */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <span className={`mt-0.5 ${workAreasList.length > 0 ? "text-emerald-600" : "text-gray-400"}`}>
                      {workAreasList.length > 0 ? "\u2713" : "\u2014"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Work Areas</p>
                      <p className="text-sm text-gray-500">
                        {workAreasList.length > 0 ? workAreasList.join(", ") : "Not set"}
                      </p>
                    </div>
                  </div>

                  {/* Service Radius */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <span className={`mt-0.5 ${serviceRadius ? "text-emerald-600" : "text-gray-400"}`}>
                      {serviceRadius ? "\u2713" : "\u2014"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Service Radius</p>
                      <p className="text-sm text-gray-500">
                        {serviceRadius ? `${serviceRadius} miles` : "Not set"}
                      </p>
                    </div>
                  </div>

                  {/* License */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <span className={`mt-0.5 ${licenseNumber ? "text-emerald-600" : "text-gray-400"}`}>
                      {licenseNumber ? "\u2713" : "\u2014"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{["CNA", "HHA", "MEDICAL_ASSISTANT"].includes(workerRole) ? "Certificate" : "License"}</p>
                      <p className="text-sm text-gray-500">
                        {licenseNumber ? `${licenseNumber}${licenseState ? ` (${licenseState})` : ""}` : "Not entered"}
                      </p>
                    </div>
                  </div>

                  {/* Certifications */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <span className={`mt-0.5 ${certifications ? "text-emerald-600" : "text-gray-400"}`}>
                      {certifications ? "\u2713" : "\u2014"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Certifications</p>
                      <p className="text-sm text-gray-500">
                        {certifications || "Not entered"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700" loading={loading}>
                    Find Shifts Near You
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
