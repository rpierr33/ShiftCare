"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUpAction } from "@/actions/auth";
import {
  Shield,
  Building2,
  Stethoscope,
  ArrowRight,
  ArrowLeft,
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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/40 to-slate-950" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-500/6 rounded-full blur-3xl animate-float-slow" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
              <Shield className="text-white" size={24} />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              ShiftCare
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl shadow-black/20">
          {/* ── Step 1: Role Selection ── */}
          {step === 1 && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">
                  Create an account
                </h1>
                <p className="text-sm text-slate-400">
                  How will you use ShiftCare?
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  type="button"
                  onClick={() => handleRoleSelect("PROVIDER")}
                  className="flex items-center gap-4 p-6 rounded-xl border border-white/10 text-left transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-500/10 hover:shadow-lg hover:shadow-blue-500/10 group"
                >
                  <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                    <Building2
                      size={28}
                      className="text-blue-400"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      I Need Staff
                    </h3>
                    <p className="text-sm text-slate-400">
                      Post shifts and find qualified healthcare workers
                    </p>
                  </div>
                  <ArrowRight
                    size={20}
                    className="text-slate-500 ml-auto group-hover:text-blue-400 transition-colors"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect("WORKER")}
                  className="flex items-center gap-4 p-6 rounded-xl border border-white/10 text-left transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-500/10 hover:shadow-lg hover:shadow-blue-500/10 group"
                >
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                    <Stethoscope
                      size={28}
                      className="text-emerald-400"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      I&apos;m Looking for Shifts
                    </h3>
                    <p className="text-sm text-slate-400">
                      Browse and pick up healthcare shifts near you
                    </p>
                  </div>
                  <ArrowRight
                    size={20}
                    className="text-slate-500 ml-auto group-hover:text-emerald-400 transition-colors"
                  />
                </button>
              </div>
            </>
          )}

          {/* ── Step 2: Registration Form ── */}
          {step === 2 && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {role === "PROVIDER"
                    ? "Sign up as a Provider"
                    : "Sign up as a Worker"}
                </h1>
                <p className="text-sm text-slate-400">
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
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
                >
                  <ArrowLeft size={16} />
                  Change role
                </button>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-scale-in">
                    {error}
                  </div>
                )}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Full Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Password
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all hover:shadow-blue-500/40"
                  loading={loading}
                >
                  Create Account
                  <ArrowRight size={16} />
                </Button>
              </form>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
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
