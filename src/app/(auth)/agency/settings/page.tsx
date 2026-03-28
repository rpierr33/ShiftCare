"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CreditCard,
  Briefcase,
  Loader2,
  CheckCircle,
  Zap,
  Shield,
  Star,
} from "lucide-react";
import { StarDisplay } from "@/components/shared/star-display";
import { updateAgencyProfile } from "@/actions/agency";
import { getSubscriptionStatus } from "@/actions/billing";
import { PLAN_LIMITS, PLAN_PRICES } from "@/types";

const TABS = [
  { key: "profile", label: "Employer Profile", icon: Building2 },
  { key: "billing", label: "Billing & Plan", icon: Briefcase },
  { key: "payment", label: "Payment Method", icon: CreditCard },
] as const;

type Tab = typeof TABS[number]["key"];

export default function AgencySettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Employer rating
  const [rating, setRating] = useState<{ average: number; count: number } | null>(null);
  useEffect(() => {
    fetch("/api/agency/rating")
      .then((r) => r.json())
      .then((data) => setRating(data))
      .catch(() => {});
  }, []);

  // Profile form state
  const [profile, setProfile] = useState({
    companyName: "",
    description: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    website: "",
    npiNumber: "",
    einNumber: "",
    licenseNumber: "",
    licenseState: "",
    contactPerson: "",
    contactTitle: "",
    contactPersonEmail: "",
    contactPersonPhone: "",
  });

  // Load profile data
  const [profileLoaded, setProfileLoaded] = useState(false);
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/agency/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile((prev) => ({ ...prev, ...data }));
        }
      } catch {
        // Silent fail, form will use empty defaults
      }
      setProfileLoaded(true);
    }
    loadProfile();
  }, []);

  // Subscription state
  const [subscription, setSubscription] = useState<{
    plan: string;
    usage: { shiftsPosted: number; workerUnlocks: number };
    limits: { shiftsPerMonth: number; workerUnlocksPerMonth: number };
    price: number;
  } | null>(null);

  useEffect(() => {
    async function loadSubscription() {
      try {
        const sub = await getSubscriptionStatus();
        if (sub) {
          setSubscription({
            plan: sub.plan,
            usage: sub.usage,
            limits: sub.limits,
            price: sub.price,
          });
        }
      } catch {
        // Silent fail
      }
    }
    loadSubscription();
  }, []);

  function handleProfileChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await updateAgencyProfile(profile);
    if (!result.success) {
      setError(result.error ?? "Failed to save.");
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm border border-slate-100 p-1 mb-6 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "profile" && (
        <form onSubmit={handleProfileSave} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <p className="text-sm text-emerald-800">Profile saved successfully.</p>
            </div>
          )}

          {/* Employer Rating */}
          {rating && rating.count > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-3">
                Your Rating
              </h2>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-400" />
                </div>
                <div>
                  <StarDisplay average={rating.average} count={rating.count} size="md" />
                  <p className="text-xs text-slate-500 mt-0.5">
                    Based on {rating.count} worker review{rating.count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">
              Employer Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name</label>
                <input name="companyName" value={profile.companyName} onChange={handleProfileChange} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea name="description" value={profile.description} onChange={handleProfileChange} rows={3} className={`${inputClass} resize-none`} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
                <input name="address" value={profile.address} onChange={handleProfileChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                <input name="city" value={profile.city} onChange={handleProfileChange} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                  <input name="state" value={profile.state} onChange={handleProfileChange} maxLength={2} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Zip</label>
                  <input name="zipCode" value={profile.zipCode} onChange={handleProfileChange} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                <input name="phone" value={profile.phone} onChange={handleProfileChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Website</label>
                <input name="website" value={profile.website} onChange={handleProfileChange} className={inputClass} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">
              Compliance & Licensing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">NPI Number</label>
                <input name="npiNumber" value={profile.npiNumber} onChange={handleProfileChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">EIN Number</label>
                <input name="einNumber" value={profile.einNumber} onChange={handleProfileChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">License Number</label>
                <input name="licenseNumber" value={profile.licenseNumber} onChange={handleProfileChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">License State</label>
                <input name="licenseState" value={profile.licenseState} onChange={handleProfileChange} maxLength={2} className={inputClass} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">
              Contact Person
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                <input name="contactPerson" value={profile.contactPerson} onChange={handleProfileChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                <input name="contactTitle" value={profile.contactTitle} onChange={handleProfileChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input name="contactPersonEmail" value={profile.contactPersonEmail} onChange={handleProfileChange} type="email" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                <input name="contactPersonPhone" value={profile.contactPersonPhone} onChange={handleProfileChange} className={inputClass} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 disabled:opacity-50 transition-colors text-sm shadow-sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      )}

      {activeTab === "billing" && (
        <div className="space-y-6">
          {subscription ? (
            <>
              {/* Current Plan Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-cyan-500 to-cyan-600" />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-900">Current Plan</h2>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 ring-1 ring-cyan-600/20">
                          {subscription.plan}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">${subscription.price}</p>
                      <p className="text-sm text-slate-500">per month</p>
                    </div>
                  </div>

                  {/* Usage */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">Shifts Posted</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {subscription.usage.shiftsPosted} / {subscription.limits.shiftsPerMonth === Infinity ? "Unlimited" : subscription.limits.shiftsPerMonth}
                        </span>
                      </div>
                      {subscription.limits.shiftsPerMonth !== Infinity && (
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-cyan-500 transition-all"
                            style={{ width: `${Math.min((subscription.usage.shiftsPosted / subscription.limits.shiftsPerMonth) * 100, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {subscription.plan === "FREE" && (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">Upgrade for more shifts</p>
                          <p className="text-cyan-100 text-sm mt-0.5">Starting at $49/mo</p>
                        </div>
                        <a
                          href="/pricing"
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-cyan-700 text-sm font-semibold rounded-lg hover:bg-cyan-50 transition-colors"
                        >
                          <Zap className="h-3.5 w-3.5" />
                          Upgrade
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice placeholder */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-3">
                  Invoice History
                </h3>
                <p className="text-sm text-slate-500">
                  Invoice history will be available when Stripe billing is connected.
                </p>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-2 justify-center text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading billing information...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "payment" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">
              Payment Method
            </h2>

            <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-4 mb-4">
              <div className="h-10 w-14 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  No payment method on file
                </p>
                <p className="text-xs text-slate-500">Add a card to post shifts</p>
              </div>
            </div>

            <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 text-white text-sm font-semibold rounded-lg hover:bg-cyan-700 transition-colors">
              <CreditCard className="h-4 w-4" />
              Add Payment Method
            </button>

            <div className="mt-4 bg-cyan-50 border border-cyan-200 rounded-lg p-3 flex items-start gap-2.5">
              <Shield className="h-4 w-4 text-cyan-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-cyan-800 leading-relaxed">
                Your card is only charged when a worker accepts a shift. Funds are held until you
                confirm completion.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
