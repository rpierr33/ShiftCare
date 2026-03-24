"use client";

import { useEffect, useState, useMemo } from "react";
import { getWorkerProfile, updateWorkerProfile } from "@/actions/worker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Shield, Briefcase, MapPin } from "lucide-react";

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

export default function WorkerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [workerRole, setWorkerRole] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [certifications, setCertifications] = useState("");
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
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
          setHourlyRate(
            profile.hourlyRate != null
              ? String(parseFloat(String(profile.hourlyRate)))
              : ""
          );
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

  // Profile completion calculation
  const completionPercent = useMemo(() => {
    const fields = [
      workerRole,
      licenseNumber,
      city,
      state,
      zipCode,
      bio,
      hourlyRate,
      yearsExperience,
      certifications,
      serviceRadius,
    ];
    const filled = fields.filter((f) => f.trim() !== "").length;
    return Math.round((filled / fields.length) * 100);
  }, [workerRole, licenseNumber, city, state, zipCode, bio, hourlyRate, yearsExperience, certifications, serviceRadius]);

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
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
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

      {/* Profile Completion Indicator */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">
            Profile {completionPercent}% complete
          </p>
          {completionPercent < 100 && (
            <p className="text-xs text-gray-500">
              Complete your profile to see more shifts
            </p>
          )}
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              completionPercent === 100
                ? "bg-emerald-500"
                : completionPercent >= 60
                  ? "bg-blue-500"
                  : "bg-amber-500"
            }`}
            style={{ width: `${completionPercent}%` }}
          />
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
        {/* Professional Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-500" />
              Professional Info
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
              id="yearsExperience"
              label="Years of Experience"
              type="number"
              min="0"
              placeholder="3"
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* About You */}
        <Card>
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
            <Input
              id="certifications"
              label="Certifications"
              placeholder="BLS, ACLS, CPR (comma-separated)"
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
            />
            <Input
              id="hourlyRate"
              label="Desired Hourly Rate ($)"
              type="number"
              step="0.01"
              min="0"
              placeholder="25.00"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
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
