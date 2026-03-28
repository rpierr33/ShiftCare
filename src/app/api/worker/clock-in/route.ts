import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isWithinGeofence } from "@/lib/geo";

/**
 * POST /api/worker/clock-in
 * Allows an assigned worker to clock in for their shift.
 * Creates a TimeEntry and transitions shift status to IN_PROGRESS.
 */
export async function POST(req: Request) {
  // Authenticate the request — only logged-in users proceed
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Enforce worker-only access
  const user = session.user as { id: string; role: string };
  if (user.role !== "WORKER") {
    return NextResponse.json({ error: "Only workers can clock in." }, { status: 403 });
  }

  // Parse request body — wrapped in try/catch for malformed JSON
  let body: { shiftId?: string; latitude?: number; longitude?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { shiftId, latitude, longitude } = body;

  // Validate required shift ID
  if (!shiftId) {
    return NextResponse.json({ error: "Shift ID is required." }, { status: 400 });
  }

  try {
    // Fetch the shift to verify existence and ownership
    const shift = await db.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      return NextResponse.json({ error: "Shift not found." }, { status: 404 });
    }

    // Verify the worker is actually assigned to this shift
    if (shift.assignedWorkerId !== user.id) {
      return NextResponse.json({ error: "You are not assigned to this shift." }, { status: 403 });
    }

    // Only ASSIGNED shifts can be clocked into
    if (shift.status !== "ASSIGNED") {
      return NextResponse.json({ error: "This shift is not in an active state." }, { status: 400 });
    }

    // Prevent duplicate clock-ins using the unique compound key
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

    // Reject if too early
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

    // Reject if shift has already ended
    if (now > shift.endTime) {
      return NextResponse.json({ error: "This shift has already ended." }, { status: 400 });
    }

    // Determine clock-in geofence status based on worker and shift coordinates
    let clockInStatus: "ON_SITE" | "OFF_SITE" | "NO_LOCATION" = "NO_LOCATION";
    let distanceMiles: number | null = null;

    if (latitude != null && longitude != null && shift.latitude != null && shift.longitude != null) {
      // Both worker and shift have coordinates — compute distance
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
      // Worker shared location but shift has no coords — give benefit of the doubt
      clockInStatus = "ON_SITE";
    }

    // BUG FIX: Use a transaction to atomically create time entry AND update shift status.
    // Previously these were separate operations — if the shift update failed, the time entry
    // would exist without the shift transitioning to IN_PROGRESS.
    const timeEntry = await db.$transaction(async (tx) => {
      // Create the time entry record for this clock-in
      const entry = await tx.timeEntry.create({
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
      await tx.shift.update({
        where: { id: shiftId },
        data: { status: "IN_PROGRESS" },
      });

      return entry;
    });

    // Return clock-in confirmation to the client
    return NextResponse.json({
      success: true,
      clockInTime: timeEntry.clockInTime,
      clockInStatus: timeEntry.clockInStatus,
      distanceMiles: timeEntry.distanceMiles,
    });
  } catch (error) {
    // Catch any unexpected DB or runtime errors
    console.error("Clock-in error:", error);
    return NextResponse.json({ error: "Failed to clock in." }, { status: 500 });
  }
}
