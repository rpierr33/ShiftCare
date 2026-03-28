"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, RotateCcw } from "lucide-react";

export function UserActions({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleToggle() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/deactivate-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: isActive ? "deactivate" : "reactivate",
        }),
      });
      const data = await res.json();

      if (data.success) {
        router.refresh();
      } else {
        setError(data.error || "Action failed.");
      }
    } catch {
      setError("An error occurred.");
    }

    setLoading(false);
  }

  return (
    <div>
      {error && <p className="text-xs text-red-500 mb-1">{error}</p>}
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
          isActive
            ? "text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100"
            : "text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
        }`}
      >
        {isActive ? (
          <>
            <Ban size={13} />
            {loading ? "..." : "Deactivate"}
          </>
        ) : (
          <>
            <RotateCcw size={13} />
            {loading ? "..." : "Reactivate"}
          </>
        )}
      </button>
    </div>
  );
}
