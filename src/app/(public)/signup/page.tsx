"use client";

import { useState, useEffect, Suspense } from "react";
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
  Heart,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
  Shield,
  Clock,
} from "lucide-react";

/* Wrapper with Suspense boundary for useSearchParams SSR compatibility */
export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}

type Role = "PROVIDER" | "WORKER";
type ProvType = "AGENCY" | "PRIVATE";

/* Evaluate password strength based on character diversity and length */
function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  if (pw.length < 8) return { level: 1, label: "Weak", color: "bg-red-500" };
  const hasLetters = /[a-zA-Z]/.test(pw);
  const hasNumbers = /[0-9]/.test(pw);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pw);
  if (hasLetters && hasNumbers && hasSpecial) return { level: 4, label: "Strong", color: "bg-emerald-500" };
  if (hasLetters && hasNumbers) return { level: 3, label: "Good", color: "bg-yellow-500" };
  return { level: 2, label: "Fair", color: "bg-orange-500" };
}

/* Visual 4-bar strength meter that shows current password quality */
function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const { level, label, color } = getPasswordStrength(password);
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= level ? color : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs mt-1 ${
        level <= 1 ? "text-red-500" : level === 2 ? "text-orange-500" : level === 3 ? "text-yellow-600" : "text-emerald-600"
      }`}>
        {label}
      </p>
    </div>
  );
}

/* Multi-step signup form: role selection -> provider type (if applicable) -> registration
   Supports query params: ?role=PROVIDER|WORKER, ?type=AGENCY|PRIVATE, ?plan=starter|professional */
function SignUpForm() {
  const searchParams = useSearchParams();
  const urlRole = searchParams.get("role") as Role | null;
  const urlType = searchParams.get("type") as ProvType | null;
  const urlPlan = searchParams.get("plan"); // e.g. "starter", "professional"
  const hasPresetRole =
    urlRole !== null && ["PROVIDER", "WORKER"].includes(urlRole);
  const hasPresetType =
    urlType !== null && ["AGENCY", "PRIVATE"].includes(urlType);

  // Determine initial step based on query params:
  // - role=WORKER -> skip to register
  // - role=PROVIDER&type=PRIVATE or type=AGENCY -> skip role + providerType, go to register
  // - role=PROVIDER (no type) -> skip role, go to providerType
  // - no params -> start at role
  // If a plan is specified, this is a provider signup — auto-select PROVIDER role
  const effectiveRole = urlPlan && !hasPresetRole ? "PROVIDER" : urlRole;
  const hasEffectiveRole = effectiveRole !== null && ["PROVIDER", "WORKER"].includes(effectiveRole);

  const getInitialStep = (): "role" | "providerType" | "register" => {
    if (!hasPresetRole && !urlPlan) return "role";
    if (effectiveRole === "WORKER") return "register";
    if (hasPresetType) return "register";
    return "providerType";
  };

  const planDetails: Record<string, { name: string; price: string }> = {
    starter: { name: "Starter Plan", price: "$49/mo" },
    professional: { name: "Professional Plan", price: "$149/mo" },
    free: { name: "Free Plan", price: "$0" },
  };

  const [step, setStep] = useState<"role" | "providerType" | "register">(
    getInitialStep()
  );
  const [role, setRole] = useState<Role>(hasEffectiveRole ? (effectiveRole as Role) : "PROVIDER");
  const [providerType, setProviderType] = useState<ProvType>(hasPresetType ? urlType! : "AGENCY");

  // Store plan in sessionStorage for post-signup use
  useEffect(() => {
    if (urlPlan && typeof window !== "undefined") {
      try {
        sessionStorage.setItem("shiftcare_signup_plan", urlPlan);
      } catch {
        // sessionStorage may be unavailable
      }
    }
  }, [urlPlan]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupName, setSignupName] = useState("");

  // Inline validation state
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({ name: "", email: "", password: "" });

  const fieldErrors: Record<string, string> = {};
  if (touched.name && !fieldValues.name.trim()) fieldErrors.name = "Full name is required";
  if (touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValues.email)) fieldErrors.email = "Valid email is required";
  if (touched.password && fieldValues.password.length < 8) fieldErrors.password = "Password must be at least 8 characters";

  const isFormValid =
    fieldValues.name.trim() !== "" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValues.email) &&
    fieldValues.password.length >= 8 &&
    confirmPassword === fieldValues.password &&
    agreedToTerms;

  function handleFieldBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function handleFieldChange(field: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [field]: value }));
    // Clear confirm password error when password changes
    if (field === "password" && confirmPasswordError && confirmPassword === value) {
      setConfirmPasswordError("");
    }
  }

  /* Navigate to next step based on selected role */
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

  function handleConfirmPasswordBlur(e: React.FocusEvent<HTMLInputElement>) {
    const form = e.target.closest("form");
    const passwordInput = form?.querySelector<HTMLInputElement>('input[name="password"]');
    if (passwordInput && e.target.value && passwordInput.value !== e.target.value) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  }

  /* Submit registration form — validates password match, calls server action, shows success screen */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      setLoading(false);
      return;
    }

    formData.set("role", role);
    formData.set("providerType", providerType);
    if (urlPlan) formData.set("plan", urlPlan);

    try {
      const result = await signUpAction(formData);

      if (!result.success) {
        setError(result.error || "Sign up failed.");
        setLoading(false);
        return;
      }

      setSignupName(fieldValues.name.split(" ")[0] || "");
      setSignupSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const [showNextSteps, setShowNextSteps] = useState(false);

  // Show "What Happens Next" screen after checkmark animation
  useEffect(() => {
    if (!signupSuccess) return;
    const timer = setTimeout(() => {
      setShowNextSteps(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [signupSuccess]);

  const getStepTitle = () => {
    if (role === "WORKER") return "Sign up as a Healthcare Professional";
    if (providerType === "AGENCY") return "Sign up as a Healthcare Employer";
    return "Sign up as a Private Employer";
  };

  // Step indicator logic — count only the steps THIS user will actually see
  const stepsUserSees: string[] = (() => {
    const steps: string[] = [];
    if (!hasEffectiveRole && !urlPlan) steps.push("Role Selection");
    if (role === "PROVIDER" && !hasPresetType) steps.push("Employer Type");
    steps.push("Registration Form");
    return steps;
  })();
  const totalSteps = stepsUserSees.length;
  const currentStepIndex = (() => {
    if (step === "role") return 0;
    if (step === "providerType") {
      return (!hasEffectiveRole && !urlPlan) ? 1 : 0;
    }
    // register step
    return totalSteps - 1;
  })();
  const currentStep = currentStepIndex + 1;
  const stepLabels = stepsUserSees;

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

        {/* Plan Banner (#4) */}
        {urlPlan && planDetails[urlPlan] && (
          <div className="mb-4 rounded-xl bg-cyan-50 border border-cyan-200 p-3 text-center">
            <p className="text-sm text-cyan-800 font-medium">
              You&apos;re signing up for the{" "}
              <span className="font-bold">{planDetails[urlPlan].name}</span>{" "}
              &mdash; {planDetails[urlPlan].price}
            </p>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">

          {/* Post-Signup Confirmation */}
          {signupSuccess && !showNextSteps && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-5 animate-bounce">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Account Created!
              </h2>
              <p className="text-slate-600 mb-6">
                Welcome to ShiftCare{signupName ? `, ${signupName}` : ""}!
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                Setting up your account...
              </div>
            </div>
          )}

          {/* What Happens Next */}
          {signupSuccess && showNextSteps && (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4 mx-auto">
                <CheckCircle size={24} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                What Happens Next
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Here&apos;s what to expect, {signupName || "welcome"}
              </p>

              {role === "WORKER" ? (
                <div className="space-y-3 text-left mb-8">
                  <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-sm font-bold">1</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Complete your profile</p>
                      <p className="text-xs text-slate-500 mt-0.5">Takes about 2 minutes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-sm font-bold">2</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Submit credentials</p>
                      <p className="text-xs text-slate-500 mt-0.5">Provisional access in 24 hours</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-sm font-bold">3</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Browse and accept shifts</p>
                      <p className="text-xs text-slate-500 mt-0.5">Start earning on your schedule</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-left mb-8">
                  <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold">1</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Complete company profile</p>
                      <p className="text-xs text-slate-500 mt-0.5">Takes about 3 minutes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold">2</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Post your first shift</p>
                      <p className="text-xs text-slate-500 mt-0.5">Go live in under 2 minutes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold">3</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Workers start accepting</p>
                      <p className="text-xs text-slate-500 mt-0.5">Shifts filled in hours, not days</p>
                    </div>
                  </div>
                </div>
              )}

              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center gap-2 w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-cyan-600/20 text-sm"
              >
                {role === "WORKER" ? "Set Up My Profile" : "Set Up My Agency"}
                <ArrowRight size={16} />
              </Link>
            </div>
          )}

          {!signupSuccess && (<>
          {/* Step Indicator (#8) */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              {stepLabels.map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i + 1 <= currentStep ? "bg-cyan-500" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-400 text-center">
              Step {currentStep} of {totalSteps}
            </p>
          </div>

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
                    Healthcare agencies and employers posting shifts
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole("PROVIDER");
                    setProviderType("PRIVATE");
                    setStep("register");
                  }}
                  className="relative text-left p-6 rounded-2xl border-2 bg-violet-50 border-violet-200 hover:border-violet-400 transition-all duration-200 group"
                >
                  <Heart size={28} className="text-violet-600 mb-2" />
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    I Need Home Care
                  </h3>
                  <p className="text-sm text-slate-500">
                    Find trusted caregivers for yourself or a loved one
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
                    Business details collected during onboarding
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
                  else if (hasPresetType) setStep("role");
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
                      autoComplete="name"
                      value={fieldValues.name}
                      onChange={(e) => handleFieldChange("name", e.target.value)}
                      onBlur={() => handleFieldBlur("name")}
                      className={`pl-10 rounded-xl border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                        fieldErrors.name ? "border-red-300 focus:ring-red-500 focus:border-red-500" : ""
                      }`}
                    />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>
                  )}
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
                      autoComplete="email"
                      value={fieldValues.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      onBlur={() => handleFieldBlur("email")}
                      className={`pl-10 rounded-xl border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                        fieldErrors.email ? "border-red-300 focus:ring-red-500 focus:border-red-500" : ""
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
                  )}
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
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 8 characters"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={fieldValues.password}
                      onChange={(e) => handleFieldChange("password", e.target.value)}
                      onBlur={() => handleFieldBlur("password")}
                      className={`pl-10 pr-10 rounded-xl border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                        fieldErrors.password ? "border-red-300 focus:ring-red-500 focus:border-red-500" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
                  )}
                  <PasswordStrengthMeter password={fieldValues.password} />
                </div>

                {/* Confirm Password (#9) */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock size={16} className="text-slate-400" />
                    </div>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (confirmPasswordError) setConfirmPasswordError("");
                      }}
                      onBlur={handleConfirmPasswordBlur}
                      className={`pl-10 pr-10 rounded-xl border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                        confirmPasswordError ? "border-red-300 focus:ring-red-500 focus:border-red-500" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPasswordError && (
                    <p className="text-red-500 text-xs mt-1">{confirmPasswordError}</p>
                  )}
                </div>

                {/* Verification Timeline Info (workers only) */}
                {role === "WORKER" && (
                  <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3.5 flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center mt-0.5">
                      <Clock size={16} className="text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-cyan-900">
                        Start accepting shifts immediately
                      </p>
                      <p className="text-xs text-cyan-700 mt-0.5 leading-relaxed">
                        Get provisional access right away while your credentials are verified (typically 7-14 business days).
                      </p>
                    </div>
                  </div>
                )}

                {/* Terms Checkbox (#12) */}
                <div>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className={`mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 ${
                        touched.confirmPassword && !agreedToTerms ? "ring-2 ring-red-300" : ""
                      }`}
                    />
                    <label htmlFor="terms" className="text-sm text-slate-500 leading-snug">
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        target="_blank"
                        className="text-cyan-600 hover:text-cyan-700 font-medium underline"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        target="_blank"
                        className="text-cyan-600 hover:text-cyan-700 font-medium underline"
                      >
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                  {touched.confirmPassword && !agreedToTerms && (
                    <p className="text-red-500 text-xs mt-1 ml-7">You must agree to the terms to continue</p>
                  )}
                </div>

                <div
                  onClick={() => {
                    if (!isFormValid && !loading) {
                      setTouched({ name: true, email: true, password: true, confirmPassword: true });
                      if (confirmPassword && confirmPassword !== fieldValues.password) {
                        setConfirmPasswordError("Passwords do not match");
                      }
                    }
                  }}
                >
                  <Button
                    type="submit"
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl py-3 h-12 font-semibold shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    loading={loading}
                    disabled={!isFormValid || loading}
                  >
                    Create Account
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </form>
            </>
          )}

          {!signupSuccess && (
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
          )}
          </>)}
        </div>

        {/* Social Proof (#9) */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <Shield size={12} className="text-slate-400" />
            500+ verified healthcare workers &middot; 2,400+ shifts filled
          </p>
        </div>
      </div>
    </div>
  );
}
