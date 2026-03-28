"use client";

import { useState } from "react";
import { initiateStripeConnect } from "@/actions/worker";
import { Landmark, CheckCircle, Loader2 } from "lucide-react";

export function StripeConnectButton({
  stripeAccountStatus,
}: {
  stripeAccountStatus: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (stripeAccountStatus === "ACTIVE") {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5">
        <CheckCircle className="h-5 w-5 text-emerald-600" />
        <span className="text-sm font-semibold text-emerald-700">
          Bank Account Connected
        </span>
      </div>
    );
  }

  async function handleSetup() {
    setLoading(true);
    setError("");
    const result = await initiateStripeConnect();
    if (result.success && result.data?.url) {
      window.location.href = result.data.url;
    } else {
      setError(result.error || "Failed to set up payouts.");
      setLoading(false);
    }
  }

  const isPending = stripeAccountStatus === "PENDING";

  return (
    <div>
      <button
        onClick={handleSetup}
        disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-3 bg-cyan-600 text-white text-sm font-semibold rounded-xl hover:bg-cyan-700 transition-colors disabled:opacity-50 shadow-sm shadow-cyan-600/20"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Landmark className="h-4 w-4" />
        )}
        {isPending ? "Continue Payout Setup" : "Set Up Payouts"}
      </button>
      {isPending && (
        <p className="mt-2 text-xs text-amber-600 font-medium">
          Your payout setup is incomplete. Click above to continue.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
