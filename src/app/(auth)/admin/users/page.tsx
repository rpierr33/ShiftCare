import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Users, Search } from "lucide-react";
import { UserActions } from "./user-actions";
import { Prisma } from "@prisma/client";

export const metadata = {
  title: "Users | ShiftCare Admin",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ tab?: string; q?: string }>;
}

const ROLE_LABELS: Record<string, string> = {
  RN: "Registered Nurse",
  LPN: "Licensed Practical Nurse",
  CNA: "CNA",
  HHA: "Home Health Aide",
  MEDICAL_ASSISTANT: "Medical Asst.",
  COMPANION: "Companion",
  OTHER: "Other",
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = await searchParams;
  const tab = params.tab || "all";
  const searchQuery = params.q || "";

  // Build where clause
  const where: Prisma.UserWhereInput = {};

  if (tab === "providers") {
    where.role = "PROVIDER";
  } else if (tab === "workers") {
    where.role = "WORKER";
  } else if (tab === "inactive") {
    where.isActive = false;
  }

  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: "insensitive" } },
      { email: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  const users = await db.user.findMany({
    where,
    include: {
      providerProfile: {
        select: {
          providerType: true,
          companyName: true,
        },
      },
      workerProfile: {
        select: {
          workerRole: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Counts for tabs
  const [totalCount, providerCount, workerCount, inactiveCount] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: "PROVIDER" } }),
      db.user.count({ where: { role: "WORKER" } }),
      db.user.count({ where: { isActive: false } }),
    ]);

  const tabs = [
    { key: "all", label: "All", count: totalCount },
    { key: "providers", label: "Providers", count: providerCount },
    { key: "workers", label: "Workers", count: workerCount },
    { key: "inactive", label: "Inactive", count: inactiveCount },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Users size={22} className="text-slate-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">
            Manage all platform users
          </p>
        </div>
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        {/* Search */}
        <form className="relative flex-1 max-w-md" action="/admin/users">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search by name or email..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {tab !== "all" && <input type="hidden" name="tab" value={tab} />}
        </form>

        {/* Tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
          {tabs.map((t) => (
            <a
              key={t.key}
              href={`/admin/users?tab=${t.key}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === t.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
              <span className="ml-1 text-slate-400">({t.count})</span>
            </a>
          ))}
        </div>
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <Users size={40} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg font-medium">No users found</p>
          {searchQuery && (
            <p className="text-slate-400 text-sm mt-1">
              Try a different search term
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1.5fr_1.5fr_100px_120px_80px_100px_120px] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div>Name</div>
            <div>Email</div>
            <div>Role</div>
            <div>Type / Specialty</div>
            <div>Status</div>
            <div>Signed Up</div>
            <div>Actions</div>
          </div>

          {/* Rows */}
          {users.map((user) => {
            const typeDetail =
              user.role === "PROVIDER"
                ? user.providerProfile?.providerType === "PRIVATE"
                  ? "Private"
                  : "Agency"
                : user.workerProfile?.workerRole
                  ? ROLE_LABELS[user.workerProfile.workerRole] ||
                    user.workerProfile.workerRole
                  : "---";

            return (
              <div
                key={user.id}
                className={`md:grid md:grid-cols-[1.5fr_1.5fr_100px_120px_80px_100px_120px] gap-4 px-6 py-4 border-b border-slate-50 last:border-0 items-center ${
                  !user.isActive ? "opacity-60" : ""
                }`}
              >
                {/* Name */}
                <div className="mb-1 md:mb-0">
                  <p className="text-sm font-medium text-slate-900">
                    {user.name}
                  </p>
                  {user.role === "PROVIDER" &&
                    user.providerProfile?.companyName && (
                      <p className="text-xs text-slate-400">
                        {user.providerProfile.companyName}
                      </p>
                    )}
                </div>

                {/* Email */}
                <div className="mb-1 md:mb-0">
                  <p className="text-sm text-slate-600 truncate">
                    {user.email}
                  </p>
                </div>

                {/* Role */}
                <div className="mb-1 md:mb-0">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.role === "PROVIDER"
                        ? "bg-cyan-50 text-cyan-700"
                        : "bg-violet-50 text-violet-700"
                    }`}
                  >
                    {user.role === "PROVIDER" ? "Provider" : "Worker"}
                  </span>
                </div>

                {/* Type / Specialty */}
                <div className="mb-1 md:mb-0">
                  <span className="text-xs text-slate-600">{typeDetail}</span>
                </div>

                {/* Status */}
                <div className="mb-1 md:mb-0">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium ${
                      user.isActive
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        user.isActive ? "bg-emerald-500" : "bg-red-400"
                      }`}
                    />
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Signed Up */}
                <div className="mb-2 md:mb-0">
                  <span className="text-xs text-slate-400">
                    {user.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Actions */}
                <UserActions userId={user.id} isActive={user.isActive} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
