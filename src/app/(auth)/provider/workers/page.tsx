import Link from "next/link";
import {
  MapPin,
  Briefcase,
  Shield,
  Lock,
  Users,
  DollarSign,
} from "lucide-react";
import { getAvailableWorkers } from "@/actions/worker";
import { getSubscriptionStatus } from "@/actions/billing";

const ROLE_LABELS: Record<string, string> = {
  RN: "Registered Nurse",
  LPN: "Licensed Practical Nurse",
  CNA: "Certified Nursing Assistant",
  HHA: "Home Health Aide",
  MEDICAL_ASSISTANT: "Medical Assistant",
  COMPANION: "Companion",
  OTHER: "Other",
};

const ROLE_SHORT: Record<string, string> = {
  RN: "RN",
  LPN: "LPN",
  CNA: "CNA",
  HHA: "HHA",
  MEDICAL_ASSISTANT: "MA",
  COMPANION: "COMP",
  OTHER: "OTH",
};

const ROLE_BADGE_COLOR: Record<string, string> = {
  RN: "bg-purple-100 text-purple-700",
  LPN: "bg-indigo-100 text-indigo-700",
  CNA: "bg-teal-100 text-teal-700",
  HHA: "bg-orange-100 text-orange-700",
  MEDICAL_ASSISTANT: "bg-cyan-100 text-cyan-700",
  COMPANION: "bg-pink-100 text-pink-700",
  OTHER: "bg-gray-100 text-gray-700",
};

export default async function BrowseWorkersPage() {
  const [workers, subscription] = await Promise.all([
    getAvailableWorkers(),
    getSubscriptionStatus(),
  ]);

  const currentPlan = subscription?.plan ?? "FREE";
  const isFreeTier = currentPlan === "FREE";

  // On free tier, show first 2 workers fully, gate the rest
  const freePreviewCount = 2;
  const visibleWorkers = isFreeTier ? workers.slice(0, freePreviewCount) : workers;
  const gatedWorkers = isFreeTier ? workers.slice(freePreviewCount) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Browse Workers</h1>
          <p className="text-gray-500 mt-1">
            Browse verified healthcare workers in your area. Contact them directly to fill shifts faster.
          </p>
        </div>
        <span className="text-sm text-gray-400">
          {workers.length} worker{workers.length !== 1 ? "s" : ""} available
        </span>
      </div>

      <div className="mb-8" />

      {workers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No workers in your area yet
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Post shifts to attract workers — they&apos;re notified in real-time.
          </p>
          <Link
            href="/provider/shifts/new"
            className="inline-flex items-center gap-2 mt-6 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Post a Shift
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Fully visible workers (all on paid, first 2 on free) */}
            {visibleWorkers.map((worker) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                isFreeTier={false}
              />
            ))}

            {/* Gated workers on free tier — blurred with overlay */}
            {gatedWorkers.length > 0 && (
              <div className="sm:col-span-2 lg:col-span-3 relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 blur-sm select-none pointer-events-none" aria-hidden="true">
                  {gatedWorkers.slice(0, 3).map((worker) => (
                    <WorkerCard
                      key={worker.id}
                      worker={worker}
                      isFreeTier={false}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
                  <div className="text-center">
                    <Lock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {gatedWorkers.length} more worker{gatedWorkers.length !== 1 ? "s" : ""} available
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Upgrade to see more workers and unlock full profiles
                    </p>
                    <Link
                      href="/provider/billing"
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Upgrade Now
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Worker Card Component ───────────────────────────────────────── */

function WorkerCard({
  worker,
  isFreeTier,
}: {
  worker: {
    id: string;
    user: { name: string };
    workerRole: string | null;
    city: string | null;
    state: string | null;
    yearsExperience: number | null;
    hourlyRate: unknown;
    credentials: { type: string; name: string }[];
  };
  isFreeTier: boolean;
}) {
  return (
    <div className="relative bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="h-11 w-11 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-gray-500">
                {isFreeTier
                  ? "?"
                  : worker.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {isFreeTier
                  ? `${worker.user.name.charAt(0)}${"*".repeat(Math.max(worker.user.name.length - 1, 3))}`
                  : worker.user.name}
              </h3>
              {worker.workerRole && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold mt-1 ${ROLE_BADGE_COLOR[worker.workerRole] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {ROLE_SHORT[worker.workerRole] ?? worker.workerRole}
                </span>
              )}
            </div>
          </div>

          {/* Verified badge for paid users */}
          {!isFreeTier && worker.credentials.length > 0 && (
            <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">
                Verified
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2.5 text-sm">
          {worker.city && worker.state && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span>
                {worker.city}, {worker.state}
              </span>
            </div>
          )}
          {worker.yearsExperience != null && (
            <div className="flex items-center gap-2 text-gray-600">
              <Briefcase className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span>
                {worker.yearsExperience}{" "}
                {worker.yearsExperience === 1 ? "year" : "years"}{" "}
                experience
              </span>
            </div>
          )}
          {worker.hourlyRate != null && !isFreeTier && (
            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="font-medium">
                ${parseFloat(String(worker.hourlyRate)).toFixed(2)}/hr
              </span>
            </div>
          )}
        </div>

        {/* Credentials for paid users */}
        {!isFreeTier && worker.credentials.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">
              Verified Credentials
            </p>
            <div className="flex flex-wrap gap-1.5">
              {worker.credentials.map((cred) => (
                <span
                  key={`${worker.id}-${cred.type}-${cred.name}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10"
                >
                  <Shield className="h-2.5 w-2.5" />
                  {cred.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Free tier overlay */}
        {isFreeTier && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
              <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-700">
                  Full profile locked
                </p>
                <Link
                  href="/provider/billing"
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Upgrade to unlock full profiles
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
