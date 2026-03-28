"use client";

import { useState } from "react";
import { Lightbulb, X } from "lucide-react";

export function DismissableCard() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative bg-white border-2 border-cyan-200 rounded-2xl p-6">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 mb-3">
        <div className="h-8 w-8 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="h-4 w-4 text-cyan-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 mt-1">How Matching Works</h3>
      </div>

      <div className="space-y-2.5 text-sm text-slate-600 leading-relaxed ml-11">
        <p>
          <span className="font-medium text-slate-800">1. Post a shift</span> -- specify the role, date, time, location, and pay rate.
        </p>
        <p>
          <span className="font-medium text-slate-800">2. Workers are notified</span> -- qualified workers in your area see the shift immediately.
        </p>
        <p>
          <span className="font-medium text-slate-800">3. A worker accepts</span> -- the first qualified worker to accept secures the shift. No double-booking.
        </p>
        <p>
          <span className="font-medium text-slate-800">4. Confirm completion</span> -- after the shift ends, confirm it was completed to release payment.
        </p>
      </div>

      <p className="text-xs text-slate-400 mt-3 ml-11">
        Average fill time: 4 hours. You are only charged when a worker accepts.
      </p>
    </div>
  );
}
