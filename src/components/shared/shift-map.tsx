"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  RN: "#9333ea",
  LPN: "#6366f1",
  CNA: "#14b8a6",
  HHA: "#f97316",
  MEDICAL_ASSISTANT: "#06b6d4",
  COMPANION: "#ec4899",
  OTHER: "#6b7280",
};

interface ShiftPin {
  id: string;
  role: string;
  title: string | null;
  location: string;
  latitude: number;
  longitude: number;
  payRate: number;
  startTime: string;
  endTime: string;
  providerName: string;
}

interface ShiftMapProps {
  shifts: ShiftPin[];
  workerLat?: number | null;
  workerLng?: number | null;
}

export function ShiftMap({ shifts, workerLat, workerLng }: ShiftMapProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<{
    shifts: ShiftPin[];
    workerLat?: number | null;
    workerLng?: number | null;
  }> | null>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues with Leaflet
    import("./shift-map-inner").then((mod) => {
      setMapComponent(() => mod.ShiftMapInner);
    });
  }, []);

  if (!MapComponent) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-2xl bg-gray-50 border border-gray-200">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <MapPin className="h-8 w-8 animate-pulse" />
          <p className="text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return <MapComponent shifts={shifts} workerLat={workerLat} workerLng={workerLng} />;
}

// Export types and colors for inner component
export { ROLE_COLORS };
export type { ShiftPin };
