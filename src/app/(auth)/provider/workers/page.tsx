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

export default async function BrowseWorkersPage() {
  const [workers, subscription] = await Promise.all([
    getAvailableWorkers(),
    getSubscriptionStatus(),
  ]);

  const currentPlan = subscription?.plan ?? "FREE";
  const isFreeTier = currentPlan === "FREE";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Browse Workers</h1>

      {workers.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">
            No workers available at this time. Check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map((worker) => (
            <div
              key={worker.id}
              className="bg-white rounded-lg border border-gray-200 p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {isFreeTier
                      ? `${worker.user.name.charAt(0)}${"*".repeat(worker.user.name.length - 1)}`
                      : worker.user.name}
                  </h3>
                  {worker.workerRole && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mt-1">
                      {ROLE_LABELS[worker.workerRole] ?? worker.workerRole}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-gray-600">
                {worker.city && worker.state && (
                  <p>
                    {worker.city}, {worker.state}
                  </p>
                )}
                {worker.yearsExperience != null && (
                  <p>
                    {worker.yearsExperience}{" "}
                    {worker.yearsExperience === 1 ? "year" : "years"} experience
                  </p>
                )}
                {worker.hourlyRate != null && !isFreeTier && (
                  <p>${parseFloat(String(worker.hourlyRate)).toFixed(2)}/hr</p>
                )}
              </div>

              {!isFreeTier && worker.credentials.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Verified Credentials</p>
                  <div className="flex flex-wrap gap-1">
                    {worker.credentials.map((cred) => (
                      <span
                        key={`${worker.id}-${cred.type}-${cred.name}`}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-50 text-green-700"
                      >
                        {cred.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isFreeTier && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <a
                    href="/provider/billing"
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Upgrade to see full profile
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
