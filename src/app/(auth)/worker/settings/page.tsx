"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Mail,
  Lock,
  Bell,
  Trash2,
  AlertTriangle,
  Check,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  updateEmail,
  updatePassword,
  updateNotificationPrefs,
  updateNotificationFrequency,
  getNotificationFrequency,
  updateTimezone,
  getUserTimezone,
  deleteAccount,
} from "@/actions/settings";
import { Globe } from "lucide-react";

type Tab = "account" | "notifications" | "danger";

const NOTIFICATION_TYPES = [
  { key: "newShiftMatches", label: "New shift matches", description: "Get notified when new shifts match your role and area" },
  { key: "shiftConfirmations", label: "Shift confirmations", description: "Updates when shifts are confirmed or cancelled" },
  { key: "paymentNotifications", label: "Payment notifications", description: "Get notified when payments are released" },
  { key: "credentialUpdates", label: "Credential updates", description: "Status updates on your credential verification" },
];

export default function WorkerSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("account");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "account", label: "Account", icon: <Mail size={16} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
    { id: "danger", label: "Danger Zone", icon: <Trash2 size={16} /> },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings size={22} className="text-cyan-600" />
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? tab.id === "danger"
                  ? "bg-white text-red-600 shadow-sm"
                  : "bg-white text-cyan-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "account" && <AccountTab />}
      {activeTab === "notifications" && <NotificationsTab />}
      {activeTab === "danger" && <DangerTab />}
    </div>
  );
}

const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HT)" },
];

function AccountTab() {
  // Email form
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Timezone
  const [timezone, setTimezone] = useState("");
  const [timezoneLoading, setTimezoneLoading] = useState(false);
  const [timezoneMessage, setTimezoneMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [timezoneLoaded, setTimezoneLoaded] = useState(false);

  // Load current timezone on mount
  useEffect(() => {
    if (!timezoneLoaded) {
      setTimezoneLoaded(true);
      getUserTimezone().then((tz) => {
        if (tz) setTimezone(tz);
      });
    }
  }, [timezoneLoaded]);

  async function handleEmailUpdate(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true);
    setEmailMessage(null);
    const result = await updateEmail(newEmail, emailPassword);
    if (result.success) {
      setEmailMessage({ type: "success", text: "Email updated successfully." });
      setNewEmail("");
      setEmailPassword("");
    } else {
      setEmailMessage({ type: "error", text: result.error || "Failed to update email." });
    }
    setEmailLoading(false);
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    setPasswordLoading(true);
    setPasswordMessage(null);
    const result = await updatePassword(currentPassword, newPassword);
    if (result.success) {
      setPasswordMessage({ type: "success", text: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordMessage({ type: "error", text: result.error || "Failed to update password." });
    }
    setPasswordLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Change Email */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Mail size={18} className="text-cyan-600" />
          Change Email
        </h2>
        <form onSubmit={handleEmailUpdate} className="space-y-4">
          {emailMessage && (
            <div className={`px-4 py-3 rounded-xl text-sm ${
              emailMessage.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}>
              {emailMessage.text}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              New Email
            </label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@email.com"
              required
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Current Password
            </label>
            <Input
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              placeholder="Enter your current password"
              required
              className="rounded-xl"
            />
          </div>
          <Button
            type="submit"
            className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl"
            disabled={emailLoading}
          >
            {emailLoading ? "Updating..." : "Update Email"}
          </Button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Lock size={18} className="text-cyan-600" />
          Change Password
        </h2>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          {passwordMessage && (
            <div className={`px-4 py-3 rounded-xl text-sm ${
              passwordMessage.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}>
              {passwordMessage.text}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Current Password
            </label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              required
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              New Password
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Confirm New Password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              minLength={8}
              className="rounded-xl"
            />
          </div>
          <Button
            type="submit"
            className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl"
            disabled={passwordLoading}
          >
            {passwordLoading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>

      {/* Timezone */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Globe size={18} className="text-cyan-600" />
          Timezone
        </h2>
        {timezoneMessage && (
          <div className={`px-4 py-3 rounded-xl text-sm mb-4 ${
            timezoneMessage.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}>
            {timezoneMessage.text}
          </div>
        )}
        <p className="text-sm text-slate-500 mb-3">
          Set your timezone so shift times display correctly for your location.
        </p>
        <select
          value={timezone}
          onChange={async (e) => {
            const val = e.target.value;
            setTimezone(val);
            setTimezoneLoading(true);
            setTimezoneMessage(null);
            const result = await updateTimezone(val);
            if (result.success) {
              setTimezoneMessage({ type: "success", text: "Timezone updated." });
            } else {
              setTimezoneMessage({ type: "error", text: result.error || "Failed to update timezone." });
            }
            setTimezoneLoading(false);
            setTimeout(() => setTimezoneMessage(null), 3000);
          }}
          disabled={timezoneLoading}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
        >
          <option value="">Select timezone...</option>
          {TIMEZONE_OPTIONS.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

const FREQUENCY_OPTIONS = [
  {
    value: "realtime",
    label: "Real-time",
    description: "Instantly when shifts are posted or status changes",
  },
  {
    value: "daily_digest",
    label: "Daily Digest",
    description: "One summary at 8 AM with new shifts and updates",
  },
  {
    value: "urgent_only",
    label: "Urgent Only",
    description: "Only for shifts starting within 24 hours and critical alerts",
  },
];

function NotificationsTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    newShiftMatches: true,
    shiftConfirmations: true,
    paymentNotifications: true,
    credentialUpdates: true,
  });
  const [frequency, setFrequency] = useState("realtime");
  const [frequencyLoaded, setFrequencyLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [frequencySaving, setFrequencySaving] = useState(false);
  const [frequencySaved, setFrequencySaved] = useState(false);

  // Load current frequency on mount
  useEffect(() => {
    if (!frequencyLoaded) {
      setFrequencyLoaded(true);
      getNotificationFrequency().then((f) => {
        if (f) setFrequency(f);
      });
    }
  }, [frequencyLoaded]);

  async function handleToggle(key: string) {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);
    setSaved(false);
    await updateNotificationPrefs(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleFrequencyChange(newFrequency: string) {
    setFrequency(newFrequency);
    setFrequencySaving(true);
    setFrequencySaved(false);
    await updateNotificationFrequency(newFrequency);
    setFrequencySaving(false);
    setFrequencySaved(true);
    setTimeout(() => setFrequencySaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Notification Frequency */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Clock size={18} className="text-cyan-600" />
            Notification Frequency
          </h2>
          {frequencySaving && (
            <span className="text-xs text-slate-400">Saving...</span>
          )}
          {frequencySaved && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <Check size={12} /> Saved
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 mb-4">
          How often do you want to be notified?
        </p>
        <div className="space-y-3">
          {FREQUENCY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                frequency === option.value
                  ? "border-cyan-300 bg-cyan-50/50 ring-1 ring-cyan-200"
                  : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
              }`}
            >
              <input
                type="radio"
                name="notification-frequency"
                value={option.value}
                checked={frequency === option.value}
                onChange={() => handleFrequencyChange(option.value)}
                className="mt-0.5 h-4 w-4 text-cyan-600 border-slate-300 focus:ring-cyan-500"
              />
              <div>
                <p className={`text-sm font-medium ${
                  frequency === option.value ? "text-cyan-900" : "text-slate-900"
                }`}>
                  {option.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {option.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Bell size={18} className="text-cyan-600" />
            Notification Types
          </h2>
          {saving && (
            <span className="text-xs text-slate-400">Saving...</span>
          )}
          {saved && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <Check size={12} /> Saved
            </span>
          )}
        </div>

        <div className="space-y-1">
          {NOTIFICATION_TYPES.map((type) => (
            <div
              key={type.key}
              className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {type.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {type.description}
                </p>
              </div>
              <button
                onClick={() => handleToggle(type.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  prefs[type.key] ? "bg-cyan-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    prefs[type.key] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DangerTab() {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (confirmation !== "DELETE") {
      setError("Please type DELETE to confirm.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await deleteAccount(confirmation);
    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "Failed to delete account.");
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-red-200 p-6">
      <h2 className="text-lg font-semibold text-red-700 mb-2 flex items-center gap-2">
        <AlertTriangle size={18} className="text-red-500" />
        Delete Account
      </h2>
      <p className="text-sm text-slate-600 mb-6">
        This action will deactivate your account. Your profile and data will no
        longer be accessible. This action cannot be easily undone.
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Type <span className="font-bold text-red-600">DELETE</span> to
          confirm
        </label>
        <Input
          type="text"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder="DELETE"
          className="rounded-xl border-red-200 focus:ring-red-500 focus:border-red-500"
        />
      </div>

      <Button
        onClick={handleDelete}
        disabled={loading || confirmation !== "DELETE"}
        className="bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50"
      >
        {loading ? "Deleting..." : "Delete My Account"}
      </Button>
    </div>
  );
}
