import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { ShieldCheck } from "lucide-react";
import { WorkerCredentialCard } from "./worker-credential-card";
import { getRequiredCredentials } from "@/lib/credential-requirements";

export const metadata = {
  title: "Credential Verification | ShiftCare Admin",
};

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  RN: "Registered Nurse",
  LPN: "Licensed Practical Nurse",
  CNA: "Certified Nursing Assistant",
  HHA: "Home Health Aide",
  MEDICAL_ASSISTANT: "Medical Assistant",
  COMPANION: "Companion",
  OTHER: "Other",
};

export default async function AdminCredentialsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const activeTab = params.tab || "all";

  // Fetch ALL workers with their credentials
  const statusFilter =
    activeTab === "pending"
      ? { credentialStatus: "PENDING" as const }
      : activeTab === "verified"
      ? { credentialStatus: "VERIFIED" as const }
      : activeTab === "expired"
      ? { credentialStatus: "EXPIRED" as const }
      : {};

  const workers = await db.workerProfile.findMany({
    where: statusFilter,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      },
      credentials: {
        orderBy: { type: "asc" },
      },
    },
    orderBy: { updatedAt: "asc" },
  });

  // Count per tab
  const [allCount, pendingCount, verifiedCount, expiredCount] =
    await Promise.all([
      db.workerProfile.count(),
      db.workerProfile.count({ where: { credentialStatus: "PENDING" } }),
      db.workerProfile.count({ where: { credentialStatus: "VERIFIED" } }),
      db.workerProfile.count({ where: { credentialStatus: "EXPIRED" } }),
    ]);

  const tabs = [
    { key: "all", label: "All", count: allCount },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "verified", label: "Verified", count: verifiedCount },
    { key: "expired", label: "Expired", count: expiredCount },
  ];

  // Serialize workers for client component
  const serializedWorkers = workers.map((w) => ({
    id: w.id,
    workerRole: w.workerRole,
    credentialStatus: w.credentialStatus,
    requiredCredentials: getRequiredCredentials(w.workerRole),
    user: {
      id: w.user.id,
      name: w.user.name,
      email: w.user.email,
      phone: w.user.phone,
      createdAt: w.user.createdAt.toISOString(),
    },
    credentials: w.credentials.map((c) => ({
      id: c.id,
      type: c.type,
      name: c.name,
      licenseNumber: c.licenseNumber,
      issuingAuthority: c.issuingAuthority,
      issueDate: c.issueDate?.toISOString() || null,
      expiryDate: c.expiryDate?.toISOString() || null,
      status: c.status,
      documentUrl: c.documentUrl,
      verifiedAt: c.verifiedAt?.toISOString() || null,
      notes: c.notes,
    })),
    roleLabel: w.workerRole
      ? ROLE_LABELS[w.workerRole] || w.workerRole
      : "N/A",
  }));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck size={22} className="text-amber-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Credential Verification
          </h1>
          <p className="text-sm text-slate-500">
            Review and verify worker credentials per individual document
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <a
            key={tab.key}
            href={`/admin/credentials${tab.key === "all" ? "" : `?tab=${tab.key}`}`}
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

      {/* Worker Cards */}
      {serializedWorkers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <ShieldCheck size={40} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg font-medium">
            No workers found
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {activeTab === "pending"
              ? "No pending credential reviews."
              : activeTab === "verified"
              ? "No verified workers yet."
              : activeTab === "expired"
              ? "No expired credentials."
              : "No workers have signed up yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {serializedWorkers.map((worker) => (
            <WorkerCredentialCard key={worker.id} worker={worker} />
          ))}
        </div>
      )}
    </div>
  );
}
