import Link from "next/link";
import {
  CheckCircle,
  Briefcase,
  Users,
  Eye,
  TrendingUp,
  Shield,
} from "lucide-react";
import { getSubscriptionStatus } from "@/actions/billing";
import { PLAN_LIMITS, PLAN_PRICES } from "@/types";
import { UpgradeButton, CancelButton } from "./billing-actions";

const PLANS = [
  {
    key: "FREE" as const,
    name: "Free",
    description: "Get started with basic shift posting.",
    accent: "from-gray-400 to-gray-500",
  },
  {
    key: "STARTER" as const,
    name: "Starter",
    description: "For growing agencies that need more shifts and worker access.",
    accent: "from-blue-500 to-blue-600",
  },
  {
    key: "PROFESSIONAL" as const,
    name: "Professional",
    description: "Unlimited shifts, unlimited workers, and priority listings.",
    accent: "from-purple-500 to-indigo-600",
  },
];

export default async function BillingPage() {
  const subscription = await getSubscriptionStatus();

  const currentPlan = subscription?.plan ?? "FREE";
  const shiftsUsed = subscription?.usage?.shiftsPosted ?? 0;
  const shiftsLimit = subscription?.limits?.shiftsPerMonth ?? 3;
  const workerUnlocksUsed = subscription?.usage?.workerUnlocks ?? 0;
  const workerUnlocksLimit = subscription?.limits?.workerUnlocksPerMonth ?? 2;

  const shiftsPercent =
    shiftsLimit === Infinity
      ? 0
      : Math.min((shiftsUsed / shiftsLimit) * 100, 100);
  const unlocksPercent =
    workerUnlocksLimit === Infinity
      ? 0
      : Math.min((workerUnlocksUsed / workerUnlocksLimit) * 100, 100);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
        <p className="text-gray-500 mt-1">
          Manage your subscription and track usage
        </p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
        <div
          className={`h-2 bg-gradient-to-r ${PLANS.find((p) => p.key === currentPlan)?.accent ?? "from-gray-400 to-gray-500"}`}
        />
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  Current Plan
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-600/20">
                  {currentPlan}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {PLANS.find((p) => p.key === currentPlan)?.description}
              </p>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <p className="text-3xl font-bold text-gray-900">
                ${PLAN_PRICES[currentPlan]}
              </p>
              <p className="text-sm text-gray-500">per month</p>
            </div>
          </div>

          {subscription?.cancelAtPeriodEnd && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-amber-800">
                Your plan will be cancelled at the end of the current billing
                period.
              </p>
            </div>
          )}

          {/* Usage Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Shifts Posted
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {shiftsUsed} /{" "}
                  {shiftsLimit === Infinity ? "Unlimited" : shiftsLimit}
                </span>
              </div>
              {shiftsLimit !== Infinity && (
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${shiftsPercent > 80 ? "bg-amber-500" : "bg-blue-500"}`}
                    style={{ width: `${shiftsPercent}%` }}
                  />
                </div>
              )}
              {shiftsLimit === Infinity && (
                <div className="w-full bg-emerald-100 rounded-full h-2.5">
                  <div className="h-2.5 rounded-full bg-emerald-500 w-full" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Worker Unlocks
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {workerUnlocksUsed} /{" "}
                  {workerUnlocksLimit === Infinity
                    ? "Unlimited"
                    : workerUnlocksLimit}
                </span>
              </div>
              {workerUnlocksLimit !== Infinity && (
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${unlocksPercent > 80 ? "bg-amber-500" : "bg-blue-500"}`}
                    style={{ width: `${unlocksPercent}%` }}
                  />
                </div>
              )}
              {workerUnlocksLimit === Infinity && (
                <div className="w-full bg-emerald-100 rounded-full h-2.5">
                  <div className="h-2.5 rounded-full bg-emerald-500 w-full" />
                </div>
              )}
            </div>
          </div>

          {currentPlan !== "FREE" && !subscription?.cancelAtPeriodEnd && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <CancelButton />
            </div>
          )}
        </div>
      </div>

      {/* MVP Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
        <p className="text-sm text-blue-800">
          Stripe integration coming soon. Plans activate immediately for MVP.
        </p>
      </div>

      {/* Plan Comparison */}
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Compare Plans
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const limits = PLAN_LIMITS[plan.key];
          const price = PLAN_PRICES[plan.key];
          const isCurrent = currentPlan === plan.key;

          return (
            <div
              key={plan.key}
              className={`bg-white rounded-xl shadow-sm overflow-hidden transition-shadow hover:shadow-md ${
                isCurrent ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {/* Gradient top border */}
              <div className={`h-1.5 bg-gradient-to-r ${plan.accent}`} />

              <div className="p-6">
                {isCurrent && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-600/20 mb-3">
                    Current Plan
                  </span>
                )}

                <h3 className="text-xl font-bold text-gray-900">
                  {plan.name}
                </h3>
                <p className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">
                    ${price}
                  </span>
                  <span className="text-sm text-gray-500">/mo</span>
                </p>
                <p className="text-sm text-gray-500 mt-2 mb-6">
                  {plan.description}
                </p>

                <ul className="space-y-3 text-sm mb-6">
                  <li className="flex items-center gap-2.5">
                    <Briefcase className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">
                      <span className="font-medium">
                        {limits.shiftsPerMonth === Infinity
                          ? "Unlimited"
                          : limits.shiftsPerMonth}
                      </span>{" "}
                      shifts/month
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">
                      <span className="font-medium">
                        {limits.workerUnlocksPerMonth === Infinity
                          ? "Unlimited"
                          : limits.workerUnlocksPerMonth}
                      </span>{" "}
                      worker unlocks/month
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    {limits.canContactWorkers ? (
                      <Eye className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-300 flex-shrink-0" />
                    )}
                    <span
                      className={
                        limits.canContactWorkers
                          ? "text-gray-700"
                          : "text-gray-400"
                      }
                    >
                      {limits.canContactWorkers
                        ? "Direct worker contact"
                        : "No direct contact"}
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    {limits.canPrioritizeListings ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-gray-300 flex-shrink-0" />
                    )}
                    <span
                      className={
                        limits.canPrioritizeListings
                          ? "text-gray-700"
                          : "text-gray-400"
                      }
                    >
                      {limits.canPrioritizeListings
                        ? "Priority listings"
                        : "Standard listings"}
                    </span>
                  </li>
                </ul>

                {isCurrent ? (
                  <div className="w-full py-2.5 px-4 bg-gray-50 text-gray-400 text-center text-sm font-medium rounded-lg border border-gray-200">
                    Current Plan
                  </div>
                ) : plan.key === "FREE" ? null : (
                  <UpgradeButton plan={plan.key} planName={plan.name} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
