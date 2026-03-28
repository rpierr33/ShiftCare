import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isWithinGeofence } from "@/lib/geo";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; role: string };
  if (user.role !== "WORKER") {
    return NextResponse.json({ error: "Only workers can clock out." }, { status: 403 });
  }

  const body = await req.json();
  const { shiftId, latitude, longitude, earlyClockOutReason } = body as {
    shiftId: string;
    latitude?: number;
    longitude?: number;
    earlyClockOutReason?: string;
  };

  if (!shiftId) {
    return NextResponse.json({ error: "Shift ID is required." }, { status: 400 });
  }

  // Fetch the shift
  const shift = await db.shift.findUnique({
    where: { id: shiftId },
  });

  if (!shift) {
    return NextResponse.json({ error: "Shift not found." }, { status: 404 });
  }

  if (shift.assignedWorkerId !== user.id) {
    return NextResponse.json({ error: "You are not assigned to this shift." }, { status: 403 });
  }

  if (shift.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "This shift is not currently in progress." }, { status: 400 });
  }

  // Fetch existing time entry — must have clocked in
  const timeEntry = await db.timeEntry.findUnique({
    where: { shiftId_workerId: { shiftId, workerId: user.id } },
  });

  if (!timeEntry) {
    return NextResponse.json({ error: "You haven't clocked in for this shift." }, { status: 400 });
  }

  if (timeEntry.clockOutTime) {
    return NextResponse.json({ error: "Already clocked out for this shift." }, { status: 409 });
  }

  const now = new Date();

  // If clocking out before shift end time, require a reason
  if (now < shift.endTime && !earlyClockOutReason?.trim()) {
    return NextResponse.json(
      { error: "Please provide a reason for clocking out early." },
      { status: 400 }
    );
  }

  // Determine clock-out location status
  let clockOutStatus: "ON_SITE" | "OFF_SITE" | "NO_LOCATION" = "NO_LOCATION";
  let clockOutDistanceMiles: number | null = null;

  if (latitude != null && longitude != null && shift.latitude != null && shift.longitude != null) {
    const result = isWithinGeofence(
      latitude,
      longitude,
      shift.latitude,
      shift.longitude,
      shift.geofenceRadius
    );
    clockOutDistanceMiles = result.distanceMiles;
    clockOutStatus = result.withinFence ? "ON_SITE" : "OFF_SITE";
  } else if (latitude != null && longitude != null) {
    clockOutStatus = "ON_SITE";
  }

  // Calculate actual hours worked
  const actualHoursRaw = (now.getTime() - timeEntry.clockInTime.getTime()) / (1000 * 60 * 60);
  const actualHours = Math.round(actualHoursRaw * 100) / 100;

  // Update the time entry with clock-out data
  const updated = await db.timeEntry.update({
    where: { id: timeEntry.id },
    data: {
      clockOutTime: now,
      clockOutLat: latitude ?? null,
      clockOutLng: longitude ?? null,
      clockOutStatus,
      clockOutDistanceMiles,
      earlyClockOutReason: earlyClockOutReason?.trim() || null,
      actualHours,
    },
  });

  return NextResponse.json({
    success: true,
    clockOutTime: updated.clockOutTime,
    clockOutStatus,
    clockOutDistanceMiles,
    actualHours,
  });
}
