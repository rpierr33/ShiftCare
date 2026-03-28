import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isWithinGeofence } from "@/lib/geo";

/**
 * POST /api/worker/clock-out
 * Allows an assigned worker to clock out of their in-progress shift.
 * Updates the TimeEntry with clock-out data and actual hours worked.
 */
export async function POST(req: Request) {
  // Authenticate the request
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Enforce worker-only access
  const user = session.user as { id: string; role: string };
  if (user.role !== "WORKER") {
    return NextResponse.json({ error: "Only workers can clock out." }, { status: 403 });
  }

  // Parse request body — wrapped in try/catch for malformed JSON
  let body: { shiftId?: string; latitude?: number; longitude?: number; earlyClockOutReason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { shiftId, latitude, longitude, earlyClockOutReason } = body;

  // Validate required field
  if (!shiftId) {
    return NextResponse.json({ error: "Shift ID is required." }, { status: 400 });
  }

  try {
    // Fetch the shift to verify state
    const shift = await db.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      return NextResponse.json({ error: "Shift not found." }, { status: 404 });
    }

    // Verify the worker is assigned to this shift
    if (shift.assignedWorkerId !== user.id) {
      return NextResponse.json({ error: "You are not assigned to this shift." }, { status: 403 });
    }

    // Only IN_PROGRESS shifts can be clocked out of
    if (shift.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "This shift is not currently in progress." }, { status: 400 });
    }

    // Fetch existing time entry — must have clocked in first
    const timeEntry = await db.timeEntry.findUnique({
      where: { shiftId_workerId: { shiftId, workerId: user.id } },
    });

    if (!timeEntry) {
      return NextResponse.json({ error: "You haven't clocked in for this shift." }, { status: 400 });
    }

    // Prevent double clock-out
    if (timeEntry.clockOutTime) {
      return NextResponse.json({ error: "Already clocked out for this shift." }, { status: 409 });
    }

    const now = new Date();

    // If clocking out before the scheduled end time, require a reason
    if (now < shift.endTime && !earlyClockOutReason?.trim()) {
      return NextResponse.json(
        { error: "Please provide a reason for clocking out early." },
        { status: 400 }
      );
    }

    // Determine clock-out geofence status
    let clockOutStatus: "ON_SITE" | "OFF_SITE" | "NO_LOCATION" = "NO_LOCATION";
    let clockOutDistanceMiles: number | null = null;

    if (latitude != null && longitude != null && shift.latitude != null && shift.longitude != null) {
      // Both coordinates available — compute distance
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
      // Worker shared location but shift has no coords — benefit of the doubt
      clockOutStatus = "ON_SITE";
    }

    // Calculate actual hours worked (rounded to 2 decimal places)
    const actualHoursRaw = (now.getTime() - timeEntry.clockInTime.getTime()) / (1000 * 60 * 60);
    const actualHours = Math.round(actualHoursRaw * 100) / 100;

    // BUG FIX: Use a transaction to atomically update time entry AND transition shift status.
    // Previously the shift status was never updated after clock-out, leaving it stuck in IN_PROGRESS.
    const updated = await db.$transaction(async (tx) => {
      // Update the time entry with clock-out data
      const entry = await tx.timeEntry.update({
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

      // BUG FIX: Transition shift status from IN_PROGRESS → COMPLETED after clock-out.
      // The original code never updated the shift status, leaving it permanently IN_PROGRESS.
      await tx.shift.update({
        where: { id: shiftId },
        data: { status: "COMPLETED" },
      });

      return entry;
    });

    // Return clock-out confirmation
    return NextResponse.json({
      success: true,
      clockOutTime: updated.clockOutTime,
      clockOutStatus,
      clockOutDistanceMiles,
      actualHours,
    });
  } catch (error) {
    // Catch any unexpected DB or runtime errors
    console.error("Clock-out error:", error);
    return NextResponse.json({ error: "Failed to clock out." }, { status: 500 });
  }
}
