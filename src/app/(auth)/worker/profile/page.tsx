"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { getWorkerProfile, updateWorkerProfile } from "@/actions/worker";
import { getUserDetailedRatings } from "@/actions/ratings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Shield,
  Briefcase,
  MapPin,
  CheckCircle,
  Circle,
  Award,
  Sparkles,
  Clock,
  AlertTriangle,
  FileCheck,
} from "lucide-react";
import { submitCredential, getWorkerCredentials } from "@/actions/credentials";
import { LocationAutocomplete, WorkAreaPicker } from "@/components/shared/location-autocomplete";

function HelpTooltip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex group ml-1">
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-100 text-slate-400 text-[10px] font-bold cursor-help leading-none hover:bg-slate-200 hover:text-slate-500 transition-colors">
        ?
      </span>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
        <span className="block max-w-xs rounded-lg bg-slate-800 text-white text-xs px-3 py-2 leading-relaxed shadow-lg whitespace-normal">
          {text}
        </span>
        <span className="block w-2 h-2 bg-slate-800 rotate-45 mx-auto -mt-1" />
      </span>
    </span>
  );
}

const WORKER_ROLE_OPTIONS = [
  { value: "RN", label: "Registered Nurse (RN)" },
  { value: "LPN", label: "Licensed Practical Nurse (LPN)" },
  { value: "CNA", label: "Certified Nursing Assistant (CNA)" },
  { value: "HHA", label: "Home Health Aide (HHA)" },
  { value: "MEDICAL_ASSISTANT", label: "Medical Assistant" },
  { value: "COMPANION", label: "Companion" },
  { value: "OTHER", label: "Other" },
];

const US_STATE_OPTIONS = [
  { value: "AL", label: "AL" }, { value: "AK", label: "AK" }, { value: "AZ", label: "AZ" },
  { value: "AR", label: "AR" }, { value: "CA", label: "CA" }, { value: "CO", label: "CO" },
  { value: "CT", label: "CT" }, { value: "DE", label: "DE" }, { value: "FL", label: "FL" },
  { value: "GA", label: "GA" }, { value: "HI", label: "HI" }, { value: "ID", label: "ID" },
  { value: "IL", label: "IL" }, { value: "IN", label: "IN" }, { value: "IA", label: "IA" },
  { value: "KS", label: "KS" }, { value: "KY", label: "KY" }, { value: "LA", label: "LA" },
  { value: "ME", label: "ME" }, { value: "MD", label: "MD" }, { value: "MA", label: "MA" },
  { value: "MI", label: "MI" }, { value: "MN", label: "MN" }, { value: "MS", label: "MS" },
  { value: "MO", label: "MO" }, { value: "MT", label: "MT" }, { value: "NE", label: "NE" },
  { value: "NV", label: "NV" }, { value: "NH", label: "NH" }, { value: "NJ", label: "NJ" },
  { value: "NM", label: "NM" }, { value: "NY", label: "NY" }, { value: "NC", label: "NC" },
  { value: "ND", label: "ND" }, { value: "OH", label: "OH" }, { value: "OK", label: "OK" },
  { value: "OR", label: "OR" }, { value: "PA", label: "PA" }, { value: "RI", label: "RI" },
  { value: "SC", label: "SC" }, { value: "SD", label: "SD" }, { value: "TN", label: "TN" },
  { value: "TX", label: "TX" }, { value: "UT", label: "UT" }, { value: "VT", label: "VT" },
  { value: "VA", label: "VA" }, { value: "WA", label: "WA" }, { value: "WV", label: "WV" },
  { value: "WI", label: "WI" }, { value: "WY", label: "WY" }, { value: "DC", label: "DC" },
];

type WorkerRole = "RN" | "LPN" | "CNA" | "HHA" | "MEDICAL_ASSISTANT" | "COMPANION" | "OTHER";

interface ChecklistItem {
  label: string;
  hint: string;
  filled: boolean;
  sectionId: string;
}

export default function WorkerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [workerRole, setWorkerRole] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [certifications, setCertifications] = useState("");
  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [serviceRadius, setServiceRadius] = useState("");
  const [workAreasList, setWorkAreasList] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  // Rating
  const [ratingAvg, setRatingAvg] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [ratingMetrics, setRatingMetrics] = useState<Array<{ label: string; average: number; count: number }>>([]);
  const [reliabilityScore, setReliabilityScore] = useState<number | null>(null);
  // Strikes
  const [strikeCount, setStrikeCount] = useState(0);

  // Individual credential records
  const [credentials, setCredentials] = useState<Array<{
    id: string;
    type: string;
    name: string;
    licenseNumber: string | null;
    issuingAuthority: string | null;
    issueDate: string | null;
    expiryDate: string | null;
    status: string;
    verifiedAt: string | null;
    notes: string | null;
    createdAt: string;
  }>>([]);

  // Credential verification state
  const [credentialStatus, setCredentialStatus] = useState<string>("PENDING");
  const [credentialExpiryDate, setCredentialExpiryDate] = useState<string | null>(null);
  const [credLicenseNumber, setCredLicenseNumber] = useState("");
  const [credIssuingState, setCredIssuingState] = useState("");
  const [credSubmitting, setCredSubmitting] = useState(false);
  const [credMessage, setCredMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getWorkerProfile();
        if (profile) {
          setWorkerRole(profile.workerRole || "");
          setLicenseNumber(profile.licenseNumber || "");
          setLicenseState(profile.licenseState || "");
          setCertifications(
            Array.isArray(profile.certifications)
              ? profile.certifications.join(", ")
              : ""
          );
          setBio(profile.bio || "");
          setYearsExperience(
            profile.yearsExperience != null ? String(profile.yearsExperience) : ""
          );
          setServiceRadius(
            profile.serviceRadiusMiles != null ? String(profile.serviceRadiusMiles) : ""
          );
          setCity(profile.city || "");
          setState(profile.state || "");
          setZipCode(profile.zipCode || "");
          setWorkAreasList(profile.workAreas || []);
          setCredentialStatus(profile.credentialStatus || "PENDING");
          setCredentialExpiryDate(
            profile.credentialExpiryDate
              ? new Date(profile.credentialExpiryDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : null
          );
          // Pre-fill credential form from profile
          setCredLicenseNumber(profile.licenseNumber || "");
          setCredIssuingState(profile.licenseState || "");

          // Load individual credentials
          const creds = await getWorkerCredentials();
          setCredentials(creds);

          // Load detailed ratings
          const rating = await getUserDetailedRatings(profile.userId);
          setRatingAvg(rating.overall.average);
          setRatingCount(rating.overall.count);
          const metrics: Array<{ label: string; average: number; count: number }> = [];
          if (rating.punctuality) metrics.push({ label: "Punctuality", ...rating.punctuality });
          if (rating.professionalism) metrics.push({ label: "Professionalism", ...rating.professionalism });
          if (rating.skillCompetence) metrics.push({ label: "Skill & Competence", ...rating.skillCompetence });
          setRatingMetrics(metrics);
          setReliabilityScore(rating.reliability ?? null);
        }
      } catch {
        setMessage({ type: "error", text: "Failed to load profile." });
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  // Checklist items
  const checklist: ChecklistItem[] = useMemo(() => [
    {
      label: "City / State set",
      hint: "Location is the #1 factor for shift matching",
      filled: city.trim() !== "" && state.trim() !== "",
      sectionId: "location-section",
    },
    {
      label: "Zip code added",
      hint: "Helps match you with nearby providers",
      filled: zipCode.trim() !== "",
      sectionId: "location-section",
    },
    {
      label: "Service radius set",
      hint: "Expand your radius to see more shifts",
      filled: serviceRadius.trim() !== "",
      sectionId: "location-section",
    },
    {
      label: "Role selected",
      hint: "Required to match with the right shifts",
      filled: workerRole.trim() !== "",
      sectionId: "role-section",
    },
    {
      label: ["CNA", "HHA", "MEDICAL_ASSISTANT"].includes(workerRole) ? "Certificate number" : "License number",
      hint: ["CNA", "HHA", "MEDICAL_ASSISTANT"].includes(workerRole) ? "Providers prefer certified workers" : "Providers prefer licensed workers",
      filled: licenseNumber.trim() !== "",
      sectionId: "role-section",
    },
    {
      label: "Certifications",
      hint: "Add these to appear in more searches",
      filled: certifications.trim() !== "",
      sectionId: "role-section",
    },
    {
      label: "Years of experience",
      hint: "Helps providers pick experienced workers",
      filled: yearsExperience.trim() !== "",
      sectionId: "experience-section",
    },
    {
      label: "Bio written",
      hint: "Tell providers what makes you stand out",
      filled: bio.trim() !== "",
      sectionId: "bio-section",
    },
  ], [city, state, zipCode, serviceRadius, workerRole, licenseNumber, certifications, yearsExperience, bio]);

  const filledCount = checklist.filter((item) => item.filled).length;
  const totalCount = checklist.length;
  const allComplete = filledCount === totalCount;

  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const certsArray = certifications
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      const result = await updateWorkerProfile({
        workerRole: workerRole ? (workerRole as WorkerRole) : undefined,
        licenseNumber: credLicenseNumber || licenseNumber || undefined,
        licenseState: credIssuingState || licenseState || undefined,
        certifications: certsArray.length > 0 ? certsArray : undefined,
        bio: bio || undefined,
        yearsExperience: yearsExperience ? parseInt(yearsExperience, 10) : undefined,
        serviceRadiusMiles: serviceRadius ? parseInt(serviceRadius, 10) : undefined,
        city: city || undefined,
        state: state || undefined,
        zipCode: zipCode || undefined,
        workAreas: workAreasList,
      });

      if (result.success) {
        setMessage({ type: "success", text: "Profile updated successfully." });
        // Auto-dismiss success message after 3 seconds
        setTimeout(() => setMessage((prev) => prev?.type === "success" ? null : prev), 3000);
        // Scroll to top so the user sees the success banner
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setMessage({ type: "error", text: result.error || "Failed to update profile." });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with Rating */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-1 text-sm text-gray-500">
            Keep your profile up to date so employers can find you.
          </p>
        </div>
        {ratingCount > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 px-4 py-3 shadow-sm min-w-[200px]">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-2xl font-bold text-slate-900">{ratingAvg.toFixed(1)}</span>
              <svg className="h-5 w-5 fill-amber-400 text-amber-400" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
              <span className="text-xs text-slate-500">({ratingCount})</span>
            </div>
            {ratingMetrics.length > 0 && (
              <div className="space-y-1.5">
                {ratingMetrics.map((m) => (
                  <div key={m.label} className="flex items-center gap-2">
                    <span className="w-24 text-[11px] text-slate-500 truncate">{m.label}</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(m.average / 5) * 100}%` }} />
                    </div>
                    <span className="text-[11px] font-medium text-slate-600 w-6 text-right">{m.average.toFixed(1)}</span>
                  </div>
                ))}
                {reliabilityScore != null && (
                  <div className="flex items-center gap-2">
                    <span className="w-24 text-[11px] text-slate-500">Reliability</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${reliabilityScore >= 90 ? "bg-emerald-500" : reliabilityScore >= 75 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${reliabilityScore}%` }} />
                    </div>
                    <span className={`text-[11px] font-medium w-6 text-right ${reliabilityScore >= 90 ? "text-emerald-600" : reliabilityScore >= 75 ? "text-amber-600" : "text-red-600"}`}>{reliabilityScore.toFixed(0)}%</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile Completion Checklist */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <p className="text-sm font-semibold text-gray-900">
              Profile Checklist
              <span className="ml-2 text-gray-500 font-normal">
                {filledCount}/{totalCount}
              </span>
            </p>
          </div>
          {allComplete && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/10">
              <CheckCircle className="h-3 w-3" />
              Complete
            </span>
          )}
        </div>

        {/* Motivating copy */}
        {!allComplete && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5 mb-4">
            <Sparkles className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800 font-medium">
              Workers with complete profiles get 3x more shift offers
            </p>
          </div>
        )}

        <div className="space-y-2">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-start gap-2.5">
              {item.filled ? (
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                {item.filled ? (
                  <p className="text-sm text-gray-600 line-through decoration-gray-300">
                    {item.label}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => scrollToSection(item.sectionId)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors text-left"
                  >
                    {item.label}
                  </button>
                )}
                {!item.filled && (
                  <p className="text-xs text-gray-400 mt-0.5">{item.hint}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10"
              : "bg-red-50 text-red-700 ring-1 ring-red-600/10"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Location (FIRST — most important for matching) */}
        <Card>
          <div id="location-section" className="scroll-mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Select
                  id="state"
                  label="State"
                  placeholder="Select state"
                  options={US_STATE_OPTIONS}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="zipCode"
                  label="Zip Code"
                  placeholder="90001"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
                <div>
                  <div className="flex items-center mb-1.5">
                    <label htmlFor="serviceRadius" className="block text-sm font-medium text-gray-700">
                      Service Radius (miles)
                    </label>
                    <HelpTooltip text="How far you're willing to travel from your home city. 20 miles is the most common setting." />
                  </div>
                  <Input
                    id="serviceRadius"
                    type="number"
                    min="1"
                    placeholder="25"
                    value={serviceRadius}
                    onChange={(e) => setServiceRadius(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full mt-4">
                <div className="flex items-center mb-1.5">
                  <span className="block text-sm font-medium text-gray-700">Work Areas</span>
                  <HelpTooltip text="Specific cities you want to work in. Leave empty to see shifts across your whole radius." />
                </div>
                <WorkAreaPicker
                  areas={workAreasList}
                  onChange={setWorkAreasList}
                />
              </div>
            </CardContent>
          </div>
        </Card>

        {/* 2. Role + Certifications */}
        <Card>
          <div id="role-section" className="scroll-mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-gray-500" />
                Role &amp; Certifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                id="workerRole"
                label="Role"
                placeholder="Select your role"
                options={WORKER_ROLE_OPTIONS}
                value={workerRole}
                onChange={(e) => setWorkerRole(e.target.value)}
              />
              <div>
                <div className="flex items-center mb-1.5">
                  <label htmlFor="certifications" className="block text-sm font-medium text-gray-700">
                    Additional Certifications
                  </label>
                  <HelpTooltip text="List any specialty certifications like BLS, CPR, or Hoyer Lift." />
                </div>
                <Input
                  id="certifications"
                  placeholder="BLS, ACLS, CPR (comma-separated)"
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                />
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Credential Verification */}
        <Card>
          <div id="credential-section" className="scroll-mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-gray-500" />
                Credential Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              {credentialStatus === "VERIFIED" ? (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-700">
                      Credentials verified
                    </span>
                  </div>
                  {credentialExpiryDate && (
                    <p className="text-xs text-emerald-600 ml-7">
                      Valid until {credentialExpiryDate}
                    </p>
                  )}
                </div>
              ) : credentialStatus === "EXPIRED" ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-semibold text-red-700">
                        Credentials expired — please resubmit
                      </span>
                    </div>
                  </div>
                  <CredentialForm
                    licenseNumber={credLicenseNumber}
                    setLicenseNumber={setCredLicenseNumber}
                    issuingState={credIssuingState}
                    setIssuingState={setCredIssuingState}
                    submitting={credSubmitting}
                    message={credMessage}
                    onSubmit={async () => {
                      setCredSubmitting(true);
                      setCredMessage(null);
                      try {
                        const result = await submitCredential({
                          licenseNumber: credLicenseNumber,
                          issuingState: credIssuingState,
                        });
                        if (result.success) {
                          setCredentialStatus("PENDING");
                          setCredentialStatus("PROVISIONAL");
                          setCredMessage({ type: "success", text: "Credentials submitted! You can now accept shifts while we verify." });
                        } else {
                          setCredMessage({ type: "error", text: result.error || "Failed to submit." });
                        }
                      } catch {
                        setCredMessage({ type: "error", text: "Something went wrong." });
                      } finally {
                        setCredSubmitting(false);
                      }
                    }}
                  />
                </div>
              ) : credentialStatus === "PROVISIONAL" ? (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-700">
                      Documents submitted — you can accept shifts now!
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600 ml-7">
                    Provisional access while we verify your credentials. Full verification typically takes 7-14 business days.
                  </p>
                </div>
              ) : credentialStatus === "PENDING" && credLicenseNumber ? (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-700">
                      Under review — verification typically takes 7-14 business days. You&apos;ll be notified once complete.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Submit your credentials to start accepting shifts. You&apos;ll get provisional access immediately while we verify.
                  </p>
                  <CredentialForm
                    licenseNumber={credLicenseNumber}
                    setLicenseNumber={setCredLicenseNumber}
                    issuingState={credIssuingState}
                    setIssuingState={setCredIssuingState}
                    submitting={credSubmitting}
                    message={credMessage}
                    onSubmit={async () => {
                      setCredSubmitting(true);
                      setCredMessage(null);
                      try {
                        const result = await submitCredential({
                          licenseNumber: credLicenseNumber,
                          issuingState: credIssuingState,
                        });
                        if (result.success) {
                          setCredentialStatus("PENDING");
                          setCredentialStatus("PROVISIONAL");
                          setCredMessage({ type: "success", text: "Credentials submitted! You can now accept shifts while we verify." });
                        } else {
                          setCredMessage({ type: "error", text: result.error || "Failed to submit." });
                        }
                      } catch {
                        setCredMessage({ type: "error", text: "Something went wrong." });
                      } finally {
                        setCredSubmitting(false);
                      }
                    }}
                  />
                </div>
              )}
            </CardContent>
          </div>
        </Card>

        {/* Individual Credential Items */}
        {credentials.length > 0 && (
          <Card>
            <div id="credential-items-section" className="scroll-mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  My Credentials ({credentials.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {credentials.map((cred) => {
                    const expiryDate = cred.expiryDate ? new Date(cred.expiryDate) : null;
                    const now = new Date();
                    const daysUntilExpiry = expiryDate
                      ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                      : null;

                    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
                      VERIFIED: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "Verified" },
                      PROVISIONAL: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", label: "Provisional (14-day access)" },
                      PENDING: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", label: "Under Review" },
                      EXPIRED: { bg: "bg-red-50 border-red-200", text: "text-red-700", label: "Expired \u2014 Renew Now" },
                      REJECTED: { bg: "bg-red-50 border-red-200", text: "text-red-700", label: "Rejected" },
                    };
                    const typeLabels: Record<string, string> = {
                      LICENSE: "License",
                      CERTIFICATION: "Certification",
                      BACKGROUND_CHECK: "Background Check",
                      TB_TEST: "TB Test",
                      CPR: "CPR",
                      OTHER: "Other",
                    };
                    const config = statusConfig[cred.status] || statusConfig.PENDING;

                    return (
                      <div
                        key={cred.id}
                        className={`rounded-xl border p-4 ${config.bg}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <p className="text-sm font-semibold text-slate-900">{cred.name}</p>
                              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600">
                                {typeLabels[cred.type] || cred.type}
                              </span>
                            </div>
                            {cred.licenseNumber && (
                              <p className="text-xs text-slate-500 mb-1">#{cred.licenseNumber}</p>
                            )}
                            {expiryDate && (
                              <p className={`text-xs mt-1 ${
                                daysUntilExpiry !== null && daysUntilExpiry < 0
                                  ? "text-red-600 font-medium"
                                  : daysUntilExpiry !== null && daysUntilExpiry <= 30
                                  ? "text-amber-600 font-medium"
                                  : "text-slate-500"
                              }`}>
                                {daysUntilExpiry !== null && daysUntilExpiry < 0
                                  ? `Expired ${Math.abs(daysUntilExpiry)} day${Math.abs(daysUntilExpiry) !== 1 ? "s" : ""} ago`
                                  : daysUntilExpiry !== null && daysUntilExpiry === 0
                                  ? "Expires today"
                                  : daysUntilExpiry !== null && daysUntilExpiry <= 30
                                  ? `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}`
                                  : `Expires ${expiryDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                                }
                              </p>
                            )}
                            {cred.notes && (
                              <p className="text-xs text-slate-400 mt-1 italic">{cred.notes}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.text} ${
                              cred.status === "VERIFIED" ? "bg-emerald-100" :
                              cred.status === "PROVISIONAL" ? "bg-blue-100" :
                              cred.status === "PENDING" ? "bg-amber-100" :
                              "bg-red-100"
                            }`}>
                              {cred.status === "VERIFIED" && <CheckCircle className="h-3 w-3" />}
                              {cred.status === "PENDING" && <Clock className="h-3 w-3" />}
                              {(cred.status === "EXPIRED" || cred.status === "REJECTED") && <AlertTriangle className="h-3 w-3" />}
                              {config.label}
                            </span>
                            {(cred.status === "EXPIRED" || cred.status === "REJECTED") && (
                              <button
                                type="button"
                                onClick={() => {
                                  const el = document.getElementById("credential-section");
                                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                              >
                                <FileCheck className="h-3 w-3" />
                                Resubmit
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </div>
          </Card>
        )}

        {/* 3. Experience */}
        <Card>
          <div id="experience-section" className="scroll-mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-4 w-4 text-gray-500" />
                Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center mb-1.5">
                  <label htmlFor="yearsExperience" className="block text-sm font-medium text-gray-700">
                    Years of Experience
                  </label>
                  <HelpTooltip text="Approximate total years working in healthcare. Employers use this to prioritize candidates." />
                </div>
                <Input
                  id="yearsExperience"
                  type="number"
                  min="0"
                  placeholder="3"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                />
              </div>
            </CardContent>
          </div>
        </Card>

        {/* 4. Bio */}
        <Card>
          <div id="bio-section" className="scroll-mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                About You
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-full">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  placeholder="Tell providers about your experience and skills..."
                  className="flex w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" loading={saving} disabled={saving} size="lg">
            {saving ? "Updating..." : "Update Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function CredentialForm({
  licenseNumber,
  setLicenseNumber,
  issuingState,
  setIssuingState,
  submitting,
  message,
  onSubmit,
}: {
  licenseNumber: string;
  setLicenseNumber: (v: string) => void;
  issuingState: string;
  setIssuingState: (v: string) => void;
  submitting: boolean;
  message: { type: "success" | "error"; text: string } | null;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="credLicenseNumber" className="block text-sm font-medium text-gray-700 mb-1.5">
            License / Certificate Number
          </label>
          <Input
            id="credLicenseNumber"
            placeholder="e.g., RN-123456"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="credIssuingState" className="block text-sm font-medium text-gray-700 mb-1.5">
            Issuing State
          </label>
          <Select
            id="credIssuingState"
            placeholder="Select state"
            options={US_STATE_OPTIONS}
            value={issuingState}
            onChange={(e) => setIssuingState(e.target.value)}
          />
        </div>
      </div>
      {message && (
        <div
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}
      <Button
        type="button"
        onClick={onSubmit}
        loading={submitting}
        disabled={submitting || !licenseNumber.trim() || !issuingState.trim()}
      >
        <FileCheck className="h-4 w-4 mr-1.5" />
        {submitting ? "Submitting..." : "Submit for Verification"}
      </Button>
    </div>
  );
}
