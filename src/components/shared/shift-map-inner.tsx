"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { ROLE_COLORS } from "./shift-map";
import type { ShiftPin } from "./shift-map";

function createRoleIcon(role: string): L.DivIcon {
  const color = ROLE_COLORS[role] || ROLE_COLORS.OTHER;
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
    html: `<div style="
      width: 28px; height: 28px; border-radius: 50%;
      background: ${color}; border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 10px; font-weight: 700;
    ">${role === "MEDICAL_ASSISTANT" ? "MA" : role === "COMPANION" ? "CO" : role}</div>`,
  });
}

const workerIcon = L.divIcon({
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  html: `<div style="
    width: 32px; height: 32px; border-radius: 50%;
    background: #2563eb; border: 3px solid white;
    box-shadow: 0 2px 8px rgba(37,99,235,0.4);
    display: flex; align-items: center; justify-content: center;
    color: white; font-size: 9px; font-weight: 700;
  ">YOU</div>`,
});

interface ShiftMapInnerProps {
  shifts: ShiftPin[];
  workerLat?: number | null;
  workerLng?: number | null;
}

export function ShiftMapInner({ shifts, workerLat, workerLng }: ShiftMapInnerProps) {
  // If no shifts have coordinates and no worker location, show empty state
  const shiftsWithCoords = shifts.filter((s) => s.latitude && s.longitude);
  if (shiftsWithCoords.length === 0 && !workerLat && !workerLng) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-2xl bg-gray-50 border border-gray-200">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <MapPin className="h-8 w-8" />
          <p className="text-sm font-medium">No shift locations available</p>
          <p className="text-xs text-gray-400">Shifts with mapped locations will appear here</p>
        </div>
      </div>
    );
  }

  // Determine center
  let centerLat = 39.8283; // US center
  let centerLng = -98.5795;
  let zoom = 4;

  if (workerLat && workerLng) {
    centerLat = workerLat;
    centerLng = workerLng;
    zoom = 10;
  } else if (shifts.length > 0) {
    centerLat = shifts[0].latitude;
    centerLng = shifts[0].longitude;
    zoom = 10;
  }

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString([], { month: "short", day: "numeric" });

  return (
    <div className="h-[500px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={zoom}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Worker location */}
        {workerLat && workerLng && (
          <Marker position={[workerLat, workerLng]} icon={workerIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-sm">Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Shift markers */}
        {shifts.map((shift) => (
          <Marker
            key={shift.id}
            position={[shift.latitude, shift.longitude]}
            icon={createRoleIcon(shift.role)}
          >
            <Popup>
              <div className="min-w-[200px] p-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ background: ROLE_COLORS[shift.role] || ROLE_COLORS.OTHER }}
                  >
                    {shift.role}
                  </span>
                  <span className="text-xs font-semibold text-gray-700">
                    ${shift.payRate}/hr
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-800 mb-0.5">
                  {shift.title || `${shift.role} Shift`}
                </p>
                <p className="text-[11px] text-gray-500 mb-0.5">{shift.providerName}</p>
                <p className="text-[11px] text-gray-500">
                  {formatDate(shift.startTime)} · {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                </p>
                <Link
                  href={`/worker/shifts/${shift.id}`}
                  className="mt-2 block rounded-lg bg-cyan-600 px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-cyan-700"
                >
                  View Details
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
