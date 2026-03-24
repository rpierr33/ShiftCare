"use client";

import { useEffect, useState } from "react";
import { getWorkerProfile, updateWorkerProfile } from "@/actions/worker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const WORKER_ROLE_OPTIONS = [
  { value: "RN", label: "Registered Nurse (RN)" },
  { value: "LPN", label: "Licensed Practical Nurse (LPN)" },
  { value: "CNA", label: "Certified Nursing Assistant (CNA)" },
  { value: "HHA", label: "Home Health Aide (HHA)" },
  { value: "MEDICAL_ASSISTANT", label: "Medical Assistant" },
  { value: "COMPANION", label: "Companion" },
  { value: "OTHER", label: "Other" },
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Keep your profile up to date so providers can find you.
        </p>
      </div>

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
        {/* Role & Credentials */}
        <Card>
          <CardHeader>
            <CardTitle>Role &amp; Credentials</CardTitle>
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
              <Input
                id="licenseState"
                label="License State"
                placeholder="e.g., CA"
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
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <Input
                id="yearsExperience"
                label="Years of Experience"
                type="number"
                min="0"
                placeholder="3"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
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
              <Input
                id="state"
                label="State"
                placeholder="CA"
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

        <div className="flex justify-end">
          <Button type="submit" loading={saving} disabled={saving} size="lg">
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
