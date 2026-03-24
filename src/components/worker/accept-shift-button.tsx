"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptShift } from "@/actions/shifts";
import { Button } from "@/components/ui/button";

interface AcceptShiftButtonProps {
  shiftId: string;
}

export function AcceptShiftButton({ shiftId }: AcceptShiftButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleAccept() {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await acceptShift(shiftId);

      if (result.success) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(result.error || "Failed to accept shift.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <p className="text-sm font-medium text-emerald-600">
        Shift accepted!
      </p>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button
        onClick={handleAccept}
        loading={loading}
        disabled={loading}
        variant="success"
        size="sm"
      >
        Accept Shift
      </Button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
