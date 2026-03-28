import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import {
  ShieldCheck,
  Building2,
  User,
  Clock,
  AlertTriangle,
  Ban,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { ProviderActions } from "./provider-actions";

export const metadata = {
  title: "Provider Verification | ShiftCare Admin",
};

export const dynamic = "force-dynamic";

const AGENCY_TYPE_LABELS: Record<string, string> = {
  HOME_HEALTH: "Home Health",
  HOSPICE: "Hospice",
  HOSPITAL: "Hospital",
  NURSE_REGISTRY: "Nurse Registry",
  STAFFING_COMPANY: "Staffing Company",
  PRIVATE_EMPLOYER: "Private Employer",
};

export default async function AdminProvidersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const activeTab = params.tab || "all";

  // Build filter based on tab — exclude private payers (they don't need verification)
  const baseFilter = { providerType: "AGENCY" as const };
  let statusFilter: Record<string, unknown> = { ...baseFilter };
  if (activeTab === "pending") {
    statusFilter = { ...baseFilter, onboardingComplete: true, complianceStatus: "PENDING" };
  } else if (activeTab === "verified") {
    statusFilter = { ...baseFilter, complianceStatus: "COMPLETE" };
  } else if (activeTab === "blocked") {
    statusFilter = { ...baseFilter, user: { isActive: false } };
  }

  const providers = await db.providerProfile.findMany({
    where: statusFilter,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          isActive: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Count per tab
  const [allCount, pendingCount, verifiedCount, blockedCount] =
    await Promise.all([
      db.providerProfile.count({ where: { providerType: "AGENCY" } }),
      db.providerProfile.count({
        where: { providerType: "AGENCY", onboardingComplete: true, complianceStatus: "PENDING" },
      }),
      db.providerProfile.count({
        where: { providerType: "AGENCY", complianceStatus: "COMPLETE" },
      }),
      db.providerProfile.count({
        where: { providerType: "AGENCY", user: { isActive: false } },
      }),
    ]);

  const tabs = [
    { key: "all", label: "All", count: allCount },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "verified", label: "Verified", count: verifiedCount },
    { key: "blocked", label: "Blocked", count: blockedCount },
  ];

  const now = new Date();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck size={22} className="text-amber-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Provider Verification
          </h1>
          <p className="text-sm text-slate-500">
            Review and verify provider accounts
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <a
            key={tab.key}
            href={`/admin/providers${tab.key === "all" ? "" : `?tab=${tab.key}`}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 text-xs ${
                activeTab === tab.key ? "text-amber-600" : "text-slate-400"
              }`}
            >
              {tab.count}
            </span>
          </a>
        ))}
      </div>

      {/* Provider list */}
      {providers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <ShieldCheck size={40} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg font-medium">
            No providers found
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {activeTab === "pending"
              ? "No providers awaiting verification."
              : activeTab === "verified"
              ? "No verified providers yet."
              : activeTab === "blocked"
              ? "No blocked providers."
              : "No providers have signed up yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {providers.map((provider) => {
            const daysSinceSignup = Math.floor(
              (now.getTime() - new Date(provider.createdAt).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            const isPending =
              provider.onboardingComplete &&
              provider.complianceStatus === "PENDING";
            const isOverdue = isPending && daysSinceSignup > 30;
            const isCritical = isPending && daysSinceSignup > 90;
            const isBlocked = !provider.user.isActive;
            const isAgency = provider.providerType === "AGENCY";

            const address = [
              provider.address,
              provider.city,
              provider.state,
              provider.zipCode,
            ]
              .filter(Boolean)
              .join(", ");

            return (
              <div
                key={provider.id}
                className={`bg-white rounded-2xl border overflow-hidden ${
                  isCritical
                    ? "border-red-200"
                    : isOverdue
                    ? "border-amber-200"
                    : isBlocked
                    ? "border-slate-300 bg-slate-50"
                    : "border-slate-100"
                }`}
              >
                {/* Warning banners */}
                {isCritical && (
                  <div className="bg-red-50 border-b border-red-200 px-6 py-2 flex items-center gap-2">
                    <Ban className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-semibold text-red-700">
                      BLOCKED - {daysSinceSignup} days unverified. Shift
                      posting disabled.
                    </span>
                  </div>
                )}
                {isOverdue && !isCritical && (
                  <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700">
                      30+ days unverified ({daysSinceSignup} days). Action
                      required.
                    </span>
                  </div>
                )}
                {isBlocked && (
                  <div className="bg-slate-100 border-b border-slate-300 px-6 py-2 flex items-center gap-2">
                    <Ban className="h-4 w-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-600">
                      Account blocked
                    </span>
                  </div>
                )}

                <div className="px-6 py-5">
                  {/* Top row: Name + badges */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-slate-900">
                          {provider.companyName}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            isAgency
                              ? "bg-blue-50 text-blue-700"
                              : "bg-violet-50 text-violet-700"
                          }`}
                        >
                          {isAgency ? "Agency" : "Private"}
                        </span>
                        {provider.complianceStatus === "COMPLETE" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                            Verified
                          </span>
                        )}
                        {provider.agencyType && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            {AGENCY_TYPE_LABELS[provider.agencyType] ||
                              provider.agencyType.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Account age: {daysSinceSignup} day{daysSinceSignup !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-400">
                        {new Date(provider.user.createdAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">
                        {provider.contactPerson || provider.user.name}
                        {provider.contactTitle && (
                          <span className="text-slate-400">
                            {" "}
                            ({provider.contactTitle})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">
                        {provider.contactPersonEmail || provider.user.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      {provider.contactPersonPhone ||
                        provider.phone ||
                        provider.user.phone ||
                        "No phone"}
                    </div>
                    {address && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2 lg:col-span-3">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        {address}
                      </div>
                    )}
                  </div>

                  {/* Business details - Agency */}
                  {isAgency && (
                    <div className="bg-slate-50 rounded-lg p-3 mb-4">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Business Details
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                            NPI Number
                          </p>
                          <p className="text-sm font-mono text-slate-700">
                            {provider.npiNumber || "---"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                            EIN / Tax ID
                          </p>
                          <p className="text-sm font-mono text-slate-700">
                            {provider.einNumber || "---"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                            AHCA License
                          </p>
                          <p className="text-sm font-mono text-slate-700">
                            {provider.ahcaLicenseNumber || "---"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                            State License
                          </p>
                          <p className="text-sm font-mono text-slate-700">
                            {provider.licenseNumber
                              ? `${provider.licenseNumber}${provider.licenseState ? ` (${provider.licenseState})` : ""}`
                              : "---"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Business details - Private */}
                  {!isAgency && (
                    <div className="bg-violet-50/50 rounded-lg p-3 mb-4">
                      <h4 className="text-xs font-semibold text-violet-500 uppercase tracking-wider mb-1">
                        Private Account
                      </h4>
                      <p className="text-xs text-slate-500">
                        Individual employer. Verify identity only - no
                        NPI/EIN required.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          provider.complianceStatus === "COMPLETE"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {provider.complianceStatus === "COMPLETE"
                          ? "Verified"
                          : "Pending Verification"}
                      </span>
                    </div>
                    <ProviderActions
                      providerId={provider.id}
                      userId={provider.user.id}
                      isVerified={provider.complianceStatus === "COMPLETE"}
                      isBlocked={isBlocked}
                      daysSinceSignup={daysSinceSignup}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
