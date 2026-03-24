"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upgradePlan, cancelSubscription } from "@/actions/billing";
import type { SubscriptionPlan } from "@prisma/client";

interface UpgradeButtonProps {
  plan: SubscriptionPlan;
  planName: string;
}

export function UpgradeButton({ plan, planName }: UpgradeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    const result = await upgradePlan(plan);
    if (!result.success) {
      setError(result.error ?? "Failed to upgrade plan.");
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <div>
      {error && (
        <p className="text-xs text-red-600 mb-2">{error}</p>
      )}
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="w-full py-2.5 px-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Upgrading..." : `Upgrade to ${planName}`}
      </button>
    </div>
  );
}

export function CancelButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

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
    router.refresh();
    setLoading(false);
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-sm text-red-600 hover:text-red-800 font-medium"
      >
        Cancel subscription
      </button>
    );
  }

  return (
    <div>
      {error && (
        <p className="text-xs text-red-600 mb-2">{error}</p>
      )}
      <p className="text-sm text-gray-600 mb-3">
        Are you sure? Your plan will remain active until the end of the billing period.
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Cancelling..." : "Yes, cancel"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          Keep my plan
        </button>
      </div>
    </div>
  );
}
