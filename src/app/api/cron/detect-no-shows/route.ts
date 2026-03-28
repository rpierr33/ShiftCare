import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find shifts where:
  // - status = ASSIGNED (worker never clocked in → still ASSIGNED, not IN_PROGRESS)
  // - startTime was 30+ minutes ago
  // - Has an assigned worker
  // - No TimeEntry exists (never clocked in)
  // - No NO_SHOW strike already recorded for this shift
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);

  const noShowShifts = await db.shift.findMany({
    where: {
      status: "ASSIGNED",
      startTime: { lt: cutoff },
      assignedWorkerId: { not: null },
      timeEntries: { none: {} },
      strikes: { none: { type: "NO_SHOW" } },
    },
    include: {
      provider: { select: { id: true, name: true } },
      assignedWorker: { select: { id: true, name: true } },
    },
  });

  let processed = 0;

  for (const shift of noShowShifts) {
    if (!shift.assignedWorkerId) continue;

    // Record the strike
    await db.strike.create({
      data: {
        userId: shift.assignedWorkerId,
        type: "NO_SHOW",
        shiftId: shift.id,
      },
    });

    // Check if this triggers suspension (3+ active strikes)
    const activeCount = await db.strike.count({
      where: { userId: shift.assignedWorkerId, decayedAt: null },
    });

    if (activeCount >= 3) {
      await db.user.update({
        where: { id: shift.assignedWorkerId },
        data: { isSuspended: true, suspendedAt: new Date() },
      });
    }

    // Notify worker
    await sendNotification({
      userId: shift.assignedWorkerId,
      type: "NO_SHOW_STRIKE",
      title: "No-Show Recorded",
      body: `You didn't clock in for "${shift.title || shift.role}" on time. This counts as a no-show strike (${activeCount} total). ${activeCount >= 3 ? "Your account has been suspended." : `${3 - activeCount} more will result in suspension.`}`,
      channels: ["inapp", "push"],
    });

    // Notify provider
    await sendNotification({
      userId: shift.providerId,
      type: "WORKER_NO_SHOW",
      title: "Worker No-Show",
      body: `${shift.assignedWorker?.name || "Worker"} didn't show up for "${shift.title || shift.role}". The shift is being reopened.`,
      channels: ["inapp", "push"],
    });

    // Reopen the shift so another worker can take it
    await db.shift.update({
      where: { id: shift.id },
      data: {
        status: "OPEN",
        assignedWorkerId: null,
        assignedAt: null,
      },
    });

    // Cancel the assignment
    const workerProfile = await db.workerProfile.findUnique({
      where: { userId: shift.assignedWorkerId },
    });
    if (workerProfile) {
      await db.assignment.updateMany({
        where: { shiftId: shift.id, workerProfileId: workerProfile.id, status: "ACCEPTED" },
        data: { status: "CANCELLED" },
      });
    }

    processed++;
  }

  return NextResponse.json({ processed, timestamp: new Date().toISOString() });
}
