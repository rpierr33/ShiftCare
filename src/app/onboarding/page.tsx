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
import { Shield, ArrowRight, Loader2 } from "lucide-react";
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
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  "DC",
];

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "PROVIDER" | "WORKER";
  onboardingCompleted: boolean;
}

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await completeProviderOnboarding({
      companyName,
      phone: phone || undefined,
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

    window.location.href = "/provider/dashboard";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/40 to-slate-950" />

      <div className="w-full max-w-lg relative z-10 animate-scale-in">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Shield className="text-white" size={24} />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              ShiftCare
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl shadow-black/20">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Set up your organization
            </h1>
            <p className="text-sm text-slate-400">
              Tell us about your healthcare facility
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-scale-in">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Company / Facility Name <span className="text-red-400">*</span>
              </label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Sunrise Senior Care"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Phone
              </label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Address
              </label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  City
                </label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="New York"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  State
                </label>
                <select
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full h-10 rounded-md border bg-white/5 border-white/10 text-white px-3 text-sm focus:border-blue-500/50 focus:ring-blue-500/20 focus:outline-none"
                >
                  <option value="" className="bg-slate-900">
                    Select...
                  </option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s} className="bg-slate-900">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="zipCode"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                ZIP Code
              </label>
              <Input
                id="zipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="10001"
                maxLength={10}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all hover:shadow-blue-500/40"
              loading={loading}
            >
              Complete Setup
              <ArrowRight size={16} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─── Worker Onboarding ───────────────────────────────────────────── */

function WorkerOnboardingForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [workerRole, setWorkerRole] = useState<WorkerRole | "">("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [phone, setPhone] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!workerRole) {
      setError("Please select your role.");
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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/40 to-slate-950" />

      <div className="w-full max-w-lg relative z-10 animate-scale-in">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Shield className="text-white" size={24} />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              ShiftCare
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl shadow-black/20">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Complete your profile
            </h1>
            <p className="text-sm text-slate-400">
              Tell us about yourself so we can match you with the right shifts
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-scale-in">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="workerRole"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Your Role <span className="text-red-400">*</span>
              </label>
              <select
                id="workerRole"
                value={workerRole}
                onChange={(e) => setWorkerRole(e.target.value as WorkerRole)}
                required
                className="w-full h-10 rounded-md border bg-white/5 border-white/10 text-white px-3 text-sm focus:border-blue-500/50 focus:ring-blue-500/20 focus:outline-none"
              >
                <option value="" className="bg-slate-900">
                  Select your role...
                </option>
                {WORKER_ROLES.map((r) => (
                  <option key={r.value} value={r.value} className="bg-slate-900">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  City <span className="text-red-400">*</span>
                </label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="New York"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  State <span className="text-red-400">*</span>
                </label>
                <select
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                  className="w-full h-10 rounded-md border bg-white/5 border-white/10 text-white px-3 text-sm focus:border-blue-500/50 focus:ring-blue-500/20 focus:outline-none"
                >
                  <option value="" className="bg-slate-900">
                    Select...
                  </option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s} className="bg-slate-900">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="zipCode"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                ZIP Code
              </label>
              <Input
                id="zipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="10001"
                maxLength={10}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Phone
              </label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all hover:shadow-blue-500/40"
              loading={loading}
            >
              Complete Profile
              <ArrowRight size={16} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
