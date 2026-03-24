"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUpAction } from "@/actions/auth";
import {
  Briefcase,
  Calendar,
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Lock,
} from "lucide-react";

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}

type Role = "PROVIDER" | "WORKER";

function SignUpForm() {
  const searchParams = useSearchParams();
  const urlRole = searchParams.get("role") as Role | null;
  const hasPresetRole =
    urlRole !== null && ["PROVIDER", "WORKER"].includes(urlRole);

  const [step, setStep] = useState<1 | 2>(hasPresetRole ? 2 : 1);
  const [role, setRole] = useState<Role>(
    hasPresetRole ? urlRole! : "PROVIDER"
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleRoleSelect(selectedRole: Role) {
    setRole(selectedRole);
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.set("role", role);

    const result = await signUpAction(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    window.location.href = "/onboarding";
  }

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
          {step === 1 && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Create an account
                </h1>
                <p className="text-sm text-slate-500">
                  How will you use ShiftCare?
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  type="button"
                  onClick={() => handleRoleSelect("PROVIDER")}
                  className={`relative text-left p-8 rounded-2xl border-2 transition-all duration-200 group ${
                    role === "PROVIDER"
                      ? "bg-cyan-50 border-cyan-400 ring-2 ring-cyan-500"
                      : "bg-cyan-50 border-cyan-200 hover:border-cyan-400"
                  }`}
                >
                  <Briefcase
                    size={32}
                    className="text-cyan-600 mb-3"
                  />
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
                  className={`relative text-left p-8 rounded-2xl border-2 transition-all duration-200 group ${
                    role === "WORKER"
                      ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500"
                      : "bg-emerald-50 border-emerald-200 hover:border-emerald-400"
                  }`}
                >
                  <Calendar
                    size={32}
                    className="text-emerald-600 mb-3"
                  />
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

          {/* Step 2: Registration Form */}
          {step === 2 && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  {role === "PROVIDER"
                    ? "Sign up as a Provider"
                    : "Sign up as a Worker"}
                </h1>
                <p className="text-sm text-slate-500">
                  Fill in your details to get started
                </p>
              </div>

              {/* Back to role selection (only if role was not pre-set via URL) */}
              {!hasPresetRole && (
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError("");
                  }}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6"
                >
                  <ArrowLeft size={16} />
                  Change role
                </button>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
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
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
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
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
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
