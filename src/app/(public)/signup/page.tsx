"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUpAction } from "@/actions/auth";
import { signIn } from "next-auth/react";
import {
  Briefcase,
  Calendar,
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Lock,
  Building2,
  Home,
} from "lucide-react";

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}

type Role = "PROVIDER" | "WORKER";
type ProvType = "AGENCY" | "PRIVATE";

function SignUpForm() {
  const searchParams = useSearchParams();
  const urlRole = searchParams.get("role") as Role | null;
  const urlPlan = searchParams.get("plan"); // e.g. "starter", "professional"
  const hasPresetRole =
    urlRole !== null && ["PROVIDER", "WORKER"].includes(urlRole);

  const [step, setStep] = useState<"role" | "providerType" | "register">(
    hasPresetRole ? (urlRole === "WORKER" ? "register" : "providerType") : "role"
  );
  const [role, setRole] = useState<Role>(hasPresetRole ? urlRole! : "PROVIDER");
  const [providerType, setProviderType] = useState<ProvType>("AGENCY");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleRoleSelect(selectedRole: Role) {
    setRole(selectedRole);
    if (selectedRole === "WORKER") {
      setStep("register");
    } else {
      setStep("providerType");
    }
  }

  function handleProviderTypeSelect(type: ProvType) {
    setProviderType(type);
    setStep("register");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.set("role", role);
    formData.set("providerType", providerType);
    if (urlPlan) formData.set("plan", urlPlan);

    const result = await signUpAction(formData);

    if (!result.success) {
      setError(result.error || "Sign up failed.");
      setLoading(false);
      return;
    }

    window.location.href = "/onboarding";
  }

  const getStepTitle = () => {
    if (role === "WORKER") return "Sign up as a Healthcare Professional";
    if (providerType === "AGENCY") return "Sign up as a Healthcare Employer";
    return "Sign up as a Private Employer";
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(circle at 50% 40%, #ecfeff 0%, #f8fafc 60%, #f1f5f9 100%)",
      }}
    >
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold text-cyan-600 tracking-tight">
              ShiftCare
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">

          {/* Step 1: Role Selection */}
          {step === "role" && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Create an account
                </h1>
                <p className="text-sm text-slate-500">
                  How will you use ShiftCare?
                </p>
              </div>

              {/* Google Sign Up */}
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
                className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors mb-4"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-400">or</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  type="button"
                  onClick={() => handleRoleSelect("PROVIDER")}
                  className="relative text-left p-6 rounded-2xl border-2 bg-cyan-50 border-cyan-200 hover:border-cyan-400 transition-all duration-200 group"
                >
                  <Briefcase size={28} className="text-cyan-600 mb-2" />
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    I Need Staff
                  </h3>
                  <p className="text-sm text-slate-500">
                    Post shifts and find qualified healthcare workers
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect("WORKER")}
                  className="relative text-left p-6 rounded-2xl border-2 bg-emerald-50 border-emerald-200 hover:border-emerald-400 transition-all duration-200 group"
                >
                  <Calendar size={28} className="text-emerald-600 mb-2" />
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    I&apos;m Looking for Shifts
                  </h3>
                  <p className="text-sm text-slate-500">
                    Browse shifts and start earning on your schedule
                  </p>
                </button>
              </div>
            </>
          )}

          {/* Step 1.5: Provider Type Selection */}
          {step === "providerType" && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  What type of employer?
                </h1>
                <p className="text-sm text-slate-500">
                  This determines what information we&apos;ll need
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep("role");
                  setError("");
                }}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <div className="grid grid-cols-1 gap-4">
                <button
                  type="button"
                  onClick={() => handleProviderTypeSelect("AGENCY")}
                  className="relative text-left p-6 rounded-2xl border-2 bg-cyan-50 border-cyan-200 hover:border-cyan-400 transition-all duration-200"
                >
                  <Building2 size={28} className="text-cyan-600 mb-2" />
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    Healthcare Employer
                  </h3>
                  <p className="text-sm text-slate-500">
                    Licensed employer, nurse registry, or staffing organization
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Requires: NPI, EIN, license info
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleProviderTypeSelect("PRIVATE")}
                  className="relative text-left p-6 rounded-2xl border-2 bg-violet-50 border-violet-200 hover:border-violet-400 transition-all duration-200"
                >
                  <Home size={28} className="text-violet-600 mb-2" />
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    Private Employer
                  </h3>
                  <p className="text-sm text-slate-500">
                    Individual or family hiring healthcare workers directly
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Quick setup — just add payment to start posting
                  </p>
                </button>
              </div>
            </>
          )}

          {/* Step 2: Registration Form */}
          {step === "register" && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-xl font-bold text-slate-900 mb-2">
                  {getStepTitle()}
                </h1>
                <p className="text-sm text-slate-500">
                  Fill in your details to get started
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (role === "WORKER") setStep("role");
                  else setStep("providerType");
                  setError("");
                }}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User size={16} className="text-slate-400" />
                    </div>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      required
                      className="pl-10 rounded-xl border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail size={16} className="text-slate-400" />
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      className="pl-10 rounded-xl border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock size={16} className="text-slate-400" />
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Minimum 8 characters"
                      required
                      minLength={8}
                      className="pl-10 rounded-xl border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl py-3 h-12 font-semibold shadow-lg shadow-cyan-600/20 transition-all"
                  loading={loading}
                >
                  Create Account
                  <ArrowRight size={16} />
                </Button>
              </form>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
