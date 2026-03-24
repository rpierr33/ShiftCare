"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { acceptShift } from "@/actions/shifts";
import { Zap, CheckCircle, Loader2, XCircle, ArrowRight, MapPin, Calendar } from "lucide-react";

interface AcceptShiftButtonProps {
  shiftId: string;
  location: string;
  startTime: string;
}

export function AcceptShiftButton({ shiftId, location, startTime }: AcceptShiftButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleAccept() {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const result = await acceptShift(shiftId);

      if (result.success) {
        setStatus("success");
        setTimeout(() => {
          router.refresh();
        }, 3000);
      } else {
        setErrorMessage(result.error || "Failed to accept shift.");
        setStatus("error");
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="w-full rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-2.5">
        <div className="flex items-center gap-2 relative">
          {/* Confetti dots */}
          <span className="absolute -top-2 -left-1 h-2 w-2 rounded-full bg-emerald-400 animate-confetti-fade" />
          <span className="absolute -top-3 left-4 h-1.5 w-1.5 rounded-full bg-blue-400 animate-confetti-fade delay-200" />
          <span className="absolute -top-1 left-8 h-2 w-2 rounded-full bg-amber-400 animate-confetti-fade delay-400" />
          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">
            You&apos;re booked! This shift is confirmed.
          </p>
        </div>
        <div className="space-y-1 pl-7">
          <div className="flex items-center gap-1.5 text-xs text-emerald-700">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Show up at {location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{startTime}</span>
          </div>
        </div>
        <div className="pl-7">
          <Link
            href="/worker/my-shifts"
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            View My Shifts
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="w-full space-y-3">
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm font-medium text-red-800">
              {errorMessage}
            </p>
          </div>
          <div className="flex items-center gap-3 pl-7">
            <button
              onClick={() => {
                setStatus("idle");
                setErrorMessage(null);
              }}
              className="text-sm font-medium text-red-700 hover:text-red-800 underline underline-offset-2 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/worker/shifts"
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Browse other shifts
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-scale-in">
      <button
        onClick={handleAccept}
        disabled={status === "loading"}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Accepting...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" />
            Accept Shift
          </>
        )}
      </button>
    </div>
  );
}
