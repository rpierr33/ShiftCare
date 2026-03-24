"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { upgradePlan, cancelSubscription } from "@/actions/billing";
import type { SubscriptionPlan } from "@prisma/client";

interface UpgradeButtonProps {
  plan: SubscriptionPlan;
  planName: string;
}

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

export function UpgradeButton({ plan, planName }: UpgradeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    const result = await upgradePlan(plan);
    if (!result.success) {
      setError(result.error ?? "Failed to upgrade plan.");
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
    setTimeout(() => {
      router.refresh();
      setSuccess(false);
    }, 1200);
  }

  if (success) {
    return (
      <div className="w-full py-2.5 px-4 bg-emerald-50 text-emerald-700 text-center text-sm font-medium rounded-lg border border-emerald-200 flex items-center justify-center gap-2">
        <CheckCircle className="h-4 w-4" />
        Upgraded to {planName}!
      </div>
    );
  }

  return (
    <div>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <Spinner />
            Upgrading...
          </>
        ) : (
          `Upgrade to ${planName}`
        )}
      </button>
    </div>
  );
}

export function CancelButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleCancel() {
    setLoading(true);
    setError(null);
    const result = await cancelSubscription();
    if (!result.success) {
      setError(result.error ?? "Failed to cancel subscription.");
      setLoading(false);
      return;
    }
    setConfirming(false);
    setSuccess(true);
    setLoading(false);
    setTimeout(() => {
      router.refresh();
      setSuccess(false);
    }, 1200);
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-700">
        <CheckCircle className="h-4 w-4" />
        Subscription cancelled. Active until end of billing period.
      </div>
    );
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
      >
        Cancel subscription
      </button>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <p className="text-sm text-gray-700 mb-3">
        Are you sure you want to cancel? Your plan will remain active until the
        end of the billing period.
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Spinner />
              Cancelling...
            </>
          ) : (
            "Yes, cancel"
          )}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Keep my plan
        </button>
      </div>
    </div>
  );
}
