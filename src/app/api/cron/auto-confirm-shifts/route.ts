import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { confirmShiftCompletion } from "@/lib/stripe-actions";
import { sendNotification } from "@/lib/notifications";

/**
 * GET /api/cron/auto-confirm-shifts
 * Cron job that runs hourly to:
 * 1. Auto-confirm Same Day Pay shifts that ended without manual confirmation
 * 2. Release standard payouts that are 4+ hours past confirmation
 *
 * Protected by CRON_SECRET bearer token.
 */
export async function GET(req: Request) {
  // Validate cron secret to prevent unauthorized invocation
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    let confirmed = 0;
    let released = 0;

    // ── Part 1: Auto-confirm Same Day Pay shifts ──
    // Find shifts with same-day pay cadence that have ended but weren't manually confirmed
    const sameDayUnconfirmed = await db.shift.findMany({
      where: {
        payCadence: "SAME_DAY",
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        endTime: { lt: now },
        completionConfirmedAt: null,
        assignedWorkerId: { not: null },
      },
      select: { id: true, providerId: true, assignedWorkerId: true },
    });

    // Process each unconfirmed same-day shift individually (one failure doesn't block others)
    for (const shift of sameDayUnconfirmed) {
      try {
        // Auto-confirm on behalf of the platform
        await confirmShiftCompletion(shift.id, "SYSTEM_AUTO");

        // Notify the provider that their shift was auto-confirmed
        await sendNotification({
          userId: shift.providerId,
          type: "SHIFT_AUTO_CONFIRMED",
          title: "Shift Auto-Confirmed",
          body: "Your same-day pay shift was auto-confirmed since it wasn't manually confirmed by EOD. Payment has been released to the worker.",
          channels: ["inapp", "push"],
        });

        // Notify the worker that payment is being processed
        if (shift.assignedWorkerId) {
          await sendNotification({
            userId: shift.assignedWorkerId,
            type: "PAYMENT_RELEASED",
            title: "Payment Released",
            body: "Your same-day pay shift has been confirmed and payment is being processed.",
            channels: ["inapp", "push"],
          });
        }

        confirmed++;
      } catch (e) {
        // Log individual failures but continue processing remaining shifts
        console.error(`Auto-confirm failed for shift ${shift.id}:`, e);
      }
    }

    // ── Part 2: Release standard payouts ──
    // Find completed standard shifts where confirmation was 4+ hours ago
    const FOUR_HOURS_AGO = new Date(now.getTime() - 4 * 60 * 60 * 1000);

    const standardReady = await db.shift.findMany({
      where: {
        payCadence: "STANDARD",
        status: "COMPLETED",
        completionConfirmedAt: { lt: FOUR_HOURS_AGO },
        assignedWorkerId: { not: null },
      },
      include: {
        shiftPayment: true,
      },
    });

    for (const shift of standardReady) {
      // Skip if payout is already processed or in progress (idempotency)
      if (shift.shiftPayment?.payoutStatus === "PAID" || shift.shiftPayment?.payoutStatus === "PROCESSING") {
        continue;
      }

      // Skip if payout is already available (idempotency)
      if (shift.shiftPayment?.payoutStatus === "AVAILABLE") {
        continue;
      }

      try {
        // Mark the payout as available for worker withdrawal
        if (shift.shiftPayment) {
          await db.shiftPayment.update({
            where: { id: shift.shiftPayment.id },
            data: { payoutStatus: "AVAILABLE" },
          });
        }

        // Notify the worker that their earnings are available
        if (shift.assignedWorkerId) {
          await sendNotification({
            userId: shift.assignedWorkerId,
            type: "PAYOUT_AVAILABLE",
            title: "Earnings Available",
            body: "Your shift payment is now available for withdrawal.",
            channels: ["inapp", "push"],
          });
        }

        released++;
      } catch (e) {
        // Log individual failures but continue processing remaining shifts
        console.error(`Payout release failed for shift ${shift.id}:`, e);
      }
    }

    // Return summary of cron job results
    return NextResponse.json({
      autoConfirmed: confirmed,
      payoutsReleased: released,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    // Top-level catch for query failures or unexpected errors
    console.error("Auto-confirm cron job error:", error);
    return NextResponse.json({ error: "Cron job failed." }, { status: 500 });
  }
}
