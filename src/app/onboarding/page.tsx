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
} from "@/actions/onboarding";
import { ArrowRight, ArrowLeft, Loader2, Check } from "lucide-react";
import { LocationAutocomplete } from "@/components/shared/location-autocomplete";
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

const selectClass =
  "w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors";

const textareaClass =
  "flex w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors resize-none";

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
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
  );
}

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

export default function OnboardingPage() {
  const { data: session, status } = useSession();
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
    const dest = user!.role === "PROVIDER" ? "/provider/dashboard" : "/worker/shifts";
    router.push(dest);
    return null;
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

/* ─── Agency Onboarding (3 steps) ──────────────────────────────────── */

function AgencyOnboardingForm() {
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
      setError("NPI number is required for agencies.");
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
      contactPerson: contactPerson || undefined,
      contactPersonEmail: contactPersonEmail || undefined,
      contactPersonPhone: contactPersonPhone || undefined,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setShowCelebration(true);
    setTimeout(() => {
      window.location.href = "/provider/shifts/new";
    }, 1000);
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
                  Your company name helps workers identify your agency
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
                    placeholder="Brief description of your agency..."
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
                  Required for healthcare agency verification
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
                      placeholder="jane@agency.com"
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

/* ─── Private Employer Onboarding (2 steps) ────────────────────────── */

function PrivateEmployerOnboardingForm() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Step 1: About You
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  // Step 2: Location
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  const totalSteps = 2;

  function handleStep1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!companyName.trim()) {
      setError("A name or label is required.");
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

    setShowCelebration(true);
    setTimeout(() => {
      window.location.href = "/provider/shifts/new";
    }, 1000);
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
          {/* Step 1: About You */}
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  About You
                </h1>
                <p className="text-sm text-gray-500">
                  Quick setup &mdash; just tell us what you need
                </p>
              </div>

              <form onSubmit={handleStep1} className="space-y-4">
                <ErrorBanner message={error} />

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Name or label for your postings <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Smith Family or Home Care"
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
                    Briefly describe what care you need
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Looking for a caregiver for my mother, 3 days a week..."
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

          {/* Step 2: Location */}
          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  Location
                </h1>
                <p className="text-sm text-gray-500">
                  Workers will see shifts in your area
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
                  <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700" loading={loading}>
                    Post Your First Shift
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

/* ─── Worker Onboarding (2 steps, unchanged) ───────────────────────── */

function WorkerOnboardingForm() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

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

    setShowCelebration(true);
    setTimeout(() => {
      window.location.href = "/worker/shifts";
    }, 1000);
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
                  Tell us about yourself so we can match you with the right shifts
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  We&apos;ll show you shifts that match your role and location. Most workers see 5+ shifts right away.
                </p>
              </div>

              <form onSubmit={handleNextStep} className="space-y-4">
                <ErrorBanner message={error} />

                <div>
                  <label htmlFor="workerRole" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Your Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="workerRole"
                    value={workerRole}
                    onChange={(e) => setWorkerRole(e.target.value as WorkerRole)}
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
                <ErrorBanner message={error} />

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
                    onClick={() => { setStep(1); setError(""); }}
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
