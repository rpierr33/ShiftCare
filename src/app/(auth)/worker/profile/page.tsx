"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { getWorkerProfile, updateWorkerProfile } from "@/actions/worker";
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
} from "lucide-react";

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
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

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
      label: "License number",
      hint: "Providers prefer licensed workers",
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
        licenseNumber: licenseNumber || undefined,
        licenseState: licenseState || undefined,
        certifications: certsArray.length > 0 ? certsArray : undefined,
        bio: bio || undefined,
        yearsExperience: yearsExperience ? parseInt(yearsExperience, 10) : undefined,
        serviceRadiusMiles: serviceRadius ? parseInt(serviceRadius, 10) : undefined,
        city: city || undefined,
        state: state || undefined,
        zipCode: zipCode || undefined,
      });

      if (result.success) {
        setMessage({ type: "success", text: "Profile updated successfully." });
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Keep your profile up to date so providers can find you.
        </p>
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
                <Input
                  id="city"
                  label="City"
                  placeholder="Los Angeles"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
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
                <Input
                  id="serviceRadius"
                  label="Service Radius (miles)"
                  type="number"
                  min="1"
                  placeholder="25"
                  value={serviceRadius}
                  onChange={(e) => setServiceRadius(e.target.value)}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="licenseNumber"
                  label="License Number"
                  placeholder="e.g., RN-123456"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                />
                <Select
                  id="licenseState"
                  label="License State"
                  placeholder="Select state"
                  options={US_STATE_OPTIONS}
                  value={licenseState}
                  onChange={(e) => setLicenseState(e.target.value)}
                />
              </div>
              <Input
                id="certifications"
                label="Certifications"
                placeholder="BLS, ACLS, CPR (comma-separated)"
                value={certifications}
                onChange={(e) => setCertifications(e.target.value)}
              />
            </CardContent>
          </div>
        </Card>

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
              <Input
                id="yearsExperience"
                label="Years of Experience"
                type="number"
                min="0"
                placeholder="3"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
              />
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
