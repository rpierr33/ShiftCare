"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { togglePreferredWorker } from "@/actions/invites";

interface PreferredToggleProps {
  workerId: string;
  initialPreferred: boolean;
}

export function PreferredToggle({ workerId, initialPreferred }: PreferredToggleProps) {
  const [isPreferred, setIsPreferred] = useState(initialPreferred);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await togglePreferredWorker(workerId);
      if (result.success) {
        setIsPreferred(result.isPreferred);
      }
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      title={isPreferred ? "Remove from preferred workers" : "Add to preferred workers"}
      className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
        isPreferred
          ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50"
          : "text-slate-300 hover:text-amber-400 hover:bg-slate-50"
      }`}
    >
      <Star
        className="h-4.5 w-4.5"
        fill={isPreferred ? "currentColor" : "none"}
        strokeWidth={2}
      />
    </button>
  );
}
