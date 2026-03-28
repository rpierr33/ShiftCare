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
    return NextResponse.json({ error: "Only workers can clock in." }, { status: 403 });
  }

  const body = await req.json();
  const { shiftId, latitude, longitude } = body as {
    shiftId: string;
    latitude?: number;
    longitude?: number;
  };

  if (!shiftId) {
    return NextResponse.json({ error: "Shift ID is required." }, { status: 400 });
  }

  // Fetch the shift with assignment check
  const shift = await db.shift.findUnique({
    where: { id: shiftId },
  });

  if (!shift) {
    return NextResponse.json({ error: "Shift not found." }, { status: 404 });
  }

  if (shift.assignedWorkerId !== user.id) {
    return NextResponse.json({ error: "You are not assigned to this shift." }, { status: 403 });
  }

  if (shift.status !== "ASSIGNED") {
    return NextResponse.json({ error: "This shift is not in an active state." }, { status: 400 });
  }

  // Check if already clocked in
  const existing = await db.timeEntry.findUnique({
    where: { shiftId_workerId: { shiftId, workerId: user.id } },
  });

  if (existing) {
    return NextResponse.json({ error: "Already clocked in for this shift." }, { status: 409 });
  }

  // Allow clock-in starting 15 minutes before shift start
  const now = new Date();
  const earlyWindow = new Date(shift.startTime);
  earlyWindow.setMinutes(earlyWindow.getMinutes() - 15);

  if (now < earlyWindow) {
    const msUntilWindow = earlyWindow.getTime() - now.getTime();
    const hoursUntil = Math.floor(msUntilWindow / 3600000);
    const minutesUntil = Math.ceil((msUntilWindow % 3600000) / 60000);
    const timeStr = hoursUntil > 0 ? `${hoursUntil}h ${minutesUntil}m` : `${minutesUntil}m`;
    return NextResponse.json(
      { error: `Too early to clock in. Clock-in opens 15 minutes before your shift (in ${timeStr}).` },
      { status: 400 }
    );
  }

  if (now > shift.endTime) {
    return NextResponse.json({ error: "This shift has already ended." }, { status: 400 });
  }

  // Determine clock-in status based on geolocation
  let clockInStatus: "ON_SITE" | "OFF_SITE" | "NO_LOCATION" = "NO_LOCATION";
  let distanceMiles: number | null = null;

  if (latitude != null && longitude != null && shift.latitude != null && shift.longitude != null) {
    const result = isWithinGeofence(
      latitude,
      longitude,
      shift.latitude,
      shift.longitude,
      shift.geofenceRadius
    );
    distanceMiles = result.distanceMiles;
    clockInStatus = result.withinFence ? "ON_SITE" : "OFF_SITE";
  } else if (latitude != null && longitude != null) {
    // Worker shared location but shift has no coords — still record it
    clockInStatus = "ON_SITE"; // Give benefit of the doubt
  }

  // Create the time entry and transition shift to IN_PROGRESS
  const timeEntry = await db.timeEntry.create({
    data: {
      shiftId,
      workerId: user.id,
      clockInTime: now,
      clockInLat: latitude ?? null,
      clockInLng: longitude ?? null,
      clockInStatus,
      distanceMiles,
    },
  });

  // Transition shift status: ASSIGNED → IN_PROGRESS
  await db.shift.update({
    where: { id: shiftId },
    data: { status: "IN_PROGRESS" },
  });

  return NextResponse.json({
    success: true,
    clockInTime: timeEntry.clockInTime,
    clockInStatus: timeEntry.clockInStatus,
    distanceMiles: timeEntry.distanceMiles,
  });
}
