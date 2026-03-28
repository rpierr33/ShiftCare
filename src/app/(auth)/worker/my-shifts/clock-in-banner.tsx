"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Clock, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

interface ClockInBannerProps {
  shiftId: string;
  shiftTitle: string;
  location: string;
  startTime: string;
  endTime: string;
  providerName: string;
}

export function ClockInBanner({
  shiftId,
  shiftTitle,
  location,
  startTime,
  endTime,
  providerName,
}: ClockInBannerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "locating" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [clockInResult, setClockInResult] = useState<{
    clockInStatus: string;
    distanceMiles: number | null;
  } | null>(null);

  const formatTime = (iso: string) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  };

  const handleClockIn = useCallback(async () => {
    setStatus("locating");
    setMessage("Getting your location...");

    let lat: number | undefined;
    let lng: number | undefined;

    // Try to get geolocation (non-blocking — clock in works without it)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });
      lat = position.coords.latitude;
      lng = position.coords.longitude;
    } catch {
      // Location denied or unavailable — still allow clock-in
    }

    setStatus("submitting");
    setMessage("Clocking you in...");

    try {
      const res = await fetch("/api/worker/clock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftId,
          latitude: lat,
          longitude: lng,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to clock in.");
        return;
      }

      setStatus("success");
      setClockInResult({
        clockInStatus: data.clockInStatus,
        distanceMiles: data.distanceMiles,
      });

      if (data.clockInStatus === "ON_SITE") {
        setMessage("You're on-site and clocked in!");
      } else if (data.clockInStatus === "OFF_SITE") {
        setMessage(`Clocked in — ${data.distanceMiles} miles from shift location.`);
      } else {
        setMessage("Clocked in (location not available).");
      }

      // Refresh the page after a brief pause so the banner disappears
      setTimeout(() => router.refresh(), 2000);
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }, [shiftId, router]);

  // Success state
  if (status === "success") {
    return (
      <div className="relative rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-8 w-8" />
            <div>
              <p className="text-xl font-bold">Clocked In!</p>
              <p className="text-emerald-100 text-sm">{message}</p>
            </div>
          </div>
          {clockInResult?.clockInStatus === "OFF_SITE" && (
            <div className="mt-3 flex items-center gap-2 bg-amber-500/20 rounded-lg px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-amber-200" />
              <p className="text-sm text-amber-100">
                You appear to be {clockInResult.distanceMiles} mi from the shift location. Your employer has been notified.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="relative rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="h-8 w-8" />
            <div>
              <p className="text-xl font-bold">Clock-In Failed</p>
              <p className="text-red-100 text-sm">{message}</p>
            </div>
          </div>
          <button
            onClick={() => { setStatus("idle"); setMessage(""); }}
            className="mt-1 bg-white/20 hover:bg-white/30 text-white font-semibold px-6 py-2.5 rounded-xl transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main clock-in banner — BIG AND BOLD
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg shadow-cyan-600/20">
      {/* Pulsing background */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 bg-[length:200%_100%] animate-gradient" />

      {/* Content */}
      <div className="relative p-6 sm:p-8 text-white">
        {/* Shift info */}
        <div className="flex items-center gap-2 mb-2">
          <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
          <p className="text-sm font-medium text-cyan-100 uppercase tracking-wider">
            Your shift is starting
          </p>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold mb-1">{shiftTitle}</h2>
        <p className="text-cyan-100 font-medium mb-4">{providerName}</p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mb-6 text-sm text-cyan-100">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{formatTime(startTime)} &ndash; {formatTime(endTime)}</span>
          </div>
        </div>

        {/* THE BUTTON — huge, impossible to miss */}
        <button
          onClick={handleClockIn}
          disabled={status === "locating" || status === "submitting"}
          className="w-full sm:w-auto min-w-[280px] bg-white text-cyan-700 hover:bg-cyan-50 active:scale-[0.98] disabled:opacity-80 disabled:cursor-not-allowed font-bold text-xl px-10 py-5 rounded-2xl shadow-xl shadow-black/10 transition-all duration-200 flex items-center justify-center gap-3"
        >
          {status === "locating" || status === "submitting" ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>{message}</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-7 w-7" />
              <span>Clock In Now</span>
            </>
          )}
        </button>

        <p className="mt-3 text-xs text-cyan-200">
          Your location will be recorded for attendance verification.
        </p>
      </div>
    </div>
  );
}
