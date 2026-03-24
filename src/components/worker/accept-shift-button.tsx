"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptShift } from "@/actions/shifts";
import { Zap, CheckCircle, Loader2 } from "lucide-react";

interface AcceptShiftButtonProps {
  shiftId: string;
}

export function AcceptShiftButton({ shiftId }: AcceptShiftButtonProps) {
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
        }, 1500);
      } else {
        setErrorMessage(result.error || "Failed to accept shift.");
        setStatus("error");
        // Reset to idle after showing error so button is usable again
        setTimeout(() => setStatus("idle"), 0);
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 0);
    }
  }

  if (status === "success") {
    return (
      <button
        disabled
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200"
      >
        <CheckCircle className="h-4 w-4" />
        Shift Accepted!
      </button>
    );
  }

  return (
    <div className="w-full space-y-2">
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
      {errorMessage && (
        <p className="text-xs text-red-600 text-center">{errorMessage}</p>
      )}
    </div>
  );
}
