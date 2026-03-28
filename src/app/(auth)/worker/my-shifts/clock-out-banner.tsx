"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, MapPin, LogOut } from "lucide-react";

interface ClockOutBannerProps {
  shiftId: string;
  shiftTitle: string;
  location: string;
  startTime: string;
  endTime: string;
  providerName: string;
  clockInTime: string;
}

export function ClockOutBanner({
  shiftId,
  shiftTitle,
  location,
  endTime,
  providerName,
  clockInTime,
}: ClockOutBannerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("");
  const [earlyReason, setEarlyReason] = useState("");
  const [showReasonField, setShowReasonField] = useState(false);

  const isBeforeEndTime = new Date() < new Date(endTime);

  // Live elapsed time counter
  useEffect(() => {
    const update = () => {
      const elapsed = Date.now() - new Date(clockInTime).getTime();
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setElapsedTime(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [clockInTime]);

  const handleClockOut = async () => {
    if (isBeforeEndTime && !earlyReason.trim()) {
      setShowReasonField(true);
      return;
    }

    setLoading(true);
    setError("");
    try {
      let lat: number | undefined;
      let lng: number | undefined;

      // Try to get location
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: true,
          })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // Location not available — proceed without it
      }

      const res = await fetch("/api/worker/clock-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftId,
          latitude: lat,
          longitude: lng,
          earlyClockOutReason: earlyReason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to clock out.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.refresh(), 1500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <LogOut className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">Clocked Out Successfully</p>
            <p className="text-sm text-emerald-100">Time worked: {elapsedTime}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white shadow-lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">{shiftTitle || "Shift in Progress"}</p>
            <p className="text-sm text-emerald-100">{providerName}</p>
            <div className="mt-1 flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {location}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-4">
              <div className="rounded-lg bg-white/15 px-3 py-1.5">
                <p className="text-xs text-emerald-200">Time Worked</p>
                <p className="font-mono text-lg font-bold">{elapsedTime}</p>
              </div>
              <div className="rounded-lg bg-white/15 px-3 py-1.5">
                <p className="text-xs text-emerald-200">Shift Ends</p>
                <p className="font-mono text-lg font-bold">
                  {new Date(endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {showReasonField && isBeforeEndTime && (
            <div>
              <textarea
                value={earlyReason}
                onChange={(e) => setEarlyReason(e.target.value)}
                placeholder="Reason for clocking out early..."
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-emerald-200 focus:outline-none focus:ring-2 focus:ring-white/30"
                rows={2}
              />
            </div>
          )}
          <button
            onClick={handleClockOut}
            disabled={loading}
            className="rounded-xl bg-white px-6 py-2.5 font-semibold text-emerald-700 shadow-md transition hover:bg-emerald-50 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-700" />
                Clocking Out...
              </span>
            ) : isBeforeEndTime ? (
              "Clock Out Early"
            ) : (
              "Clock Out"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-100">
          {error}
        </div>
      )}
    </div>
  );
}
