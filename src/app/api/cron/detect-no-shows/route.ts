import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";

/**
 * GET /api/cron/detect-no-shows
 * Cron job that detects workers who never clocked in for their assigned shift.
 * Criteria: shift is ASSIGNED, startTime was 30+ minutes ago, no TimeEntry exists.
 *
 * Actions taken per no-show:
 * 1. Record a NO_SHOW strike against the worker
 * 2. Suspend the worker if they reach 3+ active strikes
 * 3. Notify both worker and provider
 * 4. Reopen the shift for another worker
 * 5. Cancel the existing assignment
 *
 * Protected by CRON_SECRET bearer token.
 * Idempotent: the query excludes shifts that already have a NO_SHOW strike.
 */
export async function GET(req: Request) {
  // Validate cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Cutoff: shifts that started more than 30 minutes ago
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);

    // Find no-show candidates: assigned shifts past the cutoff with no clock-in and no existing strike
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
      // Defensive null check (should not happen given the query filter)
      if (!shift.assignedWorkerId) continue;

      try {
        // BUG FIX: Wrap all operations in a transaction to prevent partial state.
        // Previously, if the shift update failed after the strike was created,
        // the worker would get a strike but the shift would remain ASSIGNED.
        // Also, the original code read shift.assignedWorkerId AFTER setting it to null,
        // which would have failed in a non-cached context.

        // Capture the worker ID before the transaction clears it
        const workerId = shift.assignedWorkerId;
        const workerName = shift.assignedWorker?.name || "Worker";

        await db.$transaction(async (tx) => {
          // Record the no-show strike
          await tx.strike.create({
            data: {
              userId: workerId,
              type: "NO_SHOW",
              shiftId: shift.id,
            },
          });

          // Reopen the shift so another worker can accept it
          await tx.shift.update({
            where: { id: shift.id },
            data: {
              status: "OPEN",
              assignedWorkerId: null,
              assignedAt: null,
            },
          });

          // Cancel the existing assignment record
          const workerProfile = await tx.workerProfile.findUnique({
            where: { userId: workerId },
          });
          if (workerProfile) {
            await tx.assignment.updateMany({
              where: { shiftId: shift.id, workerProfileId: workerProfile.id, status: "ACCEPTED" },
              data: { status: "CANCELLED" },
            });
          }
        });

        // Check strike count AFTER the transaction (includes the new strike)
        const activeCount = await db.strike.count({
          where: { userId: workerId, decayedAt: null },
        });

        // Suspend if the worker has reached the suspension threshold
        if (activeCount >= 3) {
          await db.user.update({
            where: { id: workerId },
            data: { isSuspended: true, suspendedAt: new Date() },
          });
        }

        // Notify the worker about the no-show strike
        await sendNotification({
          userId: workerId,
          type: "NO_SHOW_STRIKE",
          title: "No-Show Recorded",
          body: `You didn't clock in for "${shift.title || shift.role}" on time. This counts as a no-show strike (${activeCount} total). ${activeCount >= 3 ? "Your account has been suspended." : `${3 - activeCount} more will result in suspension.`}`,
          channels: ["inapp", "push"],
        });

        // Notify the provider that the worker was a no-show
        await sendNotification({
          userId: shift.providerId,
          type: "WORKER_NO_SHOW",
          title: "Worker No-Show",
          body: `${workerName} didn't show up for "${shift.title || shift.role}". The shift is being reopened.`,
          channels: ["inapp", "push"],
        });

        processed++;
      } catch (e) {
        // Log individual failures but continue processing remaining no-shows
        console.error(`No-show processing failed for shift ${shift.id}:`, e);
      }
    }

    return NextResponse.json({ processed, timestamp: new Date().toISOString() });
  } catch (error) {
    // Top-level catch for query failures
    console.error("Detect no-shows cron error:", error);
    return NextResponse.json({ error: "Cron job failed." }, { status: 500 });
  }
}
