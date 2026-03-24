import { getSubscriptionStatus } from "@/actions/billing";
import { PLAN_LIMITS, PLAN_PRICES } from "@/types";
import { UpgradeButton, CancelButton } from "./billing-actions";

const PLANS = [
  {
    key: "FREE" as const,
    name: "Free",
    description: "Get started with basic shift posting.",
  },
  {
    key: "STARTER" as const,
    name: "Starter",
    description: "For growing agencies that need more shifts and worker access.",
  },
  {
    key: "PROFESSIONAL" as const,
    name: "Professional",
    description: "Unlimited shifts, unlimited workers, and priority listings.",
  },
];

export default async function BillingPage() {
  const subscription = await getSubscriptionStatus();

  const currentPlan = subscription?.plan ?? "FREE";
  const shiftsUsed = subscription?.usage?.shiftsPosted ?? 0;
  const shiftsLimit = subscription?.limits?.shiftsPerMonth ?? 3;
  const workerUnlocksUsed = subscription?.usage?.workerUnlocks ?? 0;
  const workerUnlocksLimit = subscription?.limits?.workerUnlocksPerMonth ?? 2;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Billing & Plans</h1>

      {/* Current Plan Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{currentPlan}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              ${PLAN_PRICES[currentPlan]}
              <span className="text-sm font-normal text-gray-500">/mo</span>
            </p>
          </div>
        </div>

        {subscription?.cancelAtPeriodEnd && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              Your plan will be cancelled at the end of the current billing period.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-500">Shifts Posted</p>
            <p className="font-medium text-gray-900">
              {shiftsUsed} / {shiftsLimit === Infinity ? "Unlimited" : shiftsLimit}
            </p>
            {shiftsLimit !== Infinity && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min((shiftsUsed / shiftsLimit) * 100, 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">Worker Unlocks</p>
            <p className="font-medium text-gray-900">
              {workerUnlocksUsed} /{" "}
              {workerUnlocksLimit === Infinity ? "Unlimited" : workerUnlocksLimit}
            </p>
            {workerUnlocksLimit !== Infinity && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min((workerUnlocksUsed / workerUnlocksLimit) * 100, 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {currentPlan !== "FREE" && !subscription?.cancelAtPeriodEnd && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <CancelButton />
          </div>
        )}
      </div>

      {/* MVP Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <p className="text-sm text-blue-800">
          Stripe integration coming soon. Plans activate immediately for MVP.
        </p>
      </div>

      {/* Plan Comparison */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Compare Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const limits = PLAN_LIMITS[plan.key];
          const price = PLAN_PRICES[plan.key];
          const isCurrent = currentPlan === plan.key;

          return (
            <div
              key={plan.key}
              className={`bg-white rounded-lg border-2 p-6 ${
                isCurrent ? "border-indigo-500" : "border-gray-200"
              }`}
            >
              {isCurrent && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mb-3">
                  Current Plan
                </span>
              )}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${price}
                <span className="text-sm font-normal text-gray-500">/mo</span>
              </p>
              <p className="text-sm text-gray-500 mt-2 mb-4">{plan.description}</p>

              <ul className="space-y-2 text-sm text-gray-700 mb-6">
                <li>
                  {limits.shiftsPerMonth === Infinity
                    ? "Unlimited"
                    : limits.shiftsPerMonth}{" "}
                  shifts/month
                </li>
                <li>
                  {limits.workerUnlocksPerMonth === Infinity
                    ? "Unlimited"
                    : limits.workerUnlocksPerMonth}{" "}
                  worker unlocks/month
                </li>
                <li>
                  {limits.canContactWorkers
                    ? "Direct worker contact"
                    : "No direct contact"}
                </li>
                <li>
                  {limits.canPrioritizeListings
                    ? "Priority listings"
                    : "Standard listings"}
                </li>
              </ul>

              {isCurrent ? (
                <div className="w-full py-2.5 px-4 bg-gray-100 text-gray-500 text-center text-sm font-medium rounded-lg">
                  Current Plan
                </div>
              ) : plan.key === "FREE" ? null : (
                <UpgradeButton plan={plan.key} planName={plan.name} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
