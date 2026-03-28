import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { confirmShiftCompletion } from "@/lib/stripe-actions";
import { sendNotification } from "@/lib/notifications";

/**
 * Auto-confirms Same Day Pay shifts that ended and weren't confirmed by EOD.
 * Run every hour. If shift has payCadence=SAME_DAY, endTime has passed,
 * and status is still IN_PROGRESS or ASSIGNED, auto-confirm and trigger payout.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let confirmed = 0;
  let released = 0;

  // 1. Auto-confirm Same Day Pay shifts that ended but weren't confirmed
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

  for (const shift of sameDayUnconfirmed) {
    try {
      // Auto-confirm on behalf of platform
      await confirmShiftCompletion(shift.id, "SYSTEM_AUTO");

      await sendNotification({
        userId: shift.providerId,
        type: "SHIFT_AUTO_CONFIRMED",
        title: "Shift Auto-Confirmed",
        body: "Your same-day pay shift was auto-confirmed since it wasn't manually confirmed by EOD. Payment has been released to the worker.",
        channels: ["inapp", "push"],
      });

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
      console.error(`Auto-confirm failed for shift ${shift.id}:`, e);
    }
  }

  // 2. Release standard payouts that are 4+ hours past confirmation
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
    // Check if payout already processed
    if (shift.shiftPayment?.payoutStatus === "PAID" || shift.shiftPayment?.payoutStatus === "PROCESSING") {
      continue;
    }

    try {
      // Update payout status to AVAILABLE (ready for worker withdrawal)
      if (shift.shiftPayment) {
        await db.shiftPayment.update({
          where: { id: shift.shiftPayment.id },
          data: { payoutStatus: "AVAILABLE" },
        });
      }

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
      console.error(`Payout release failed for shift ${shift.id}:`, e);
    }
  }

  return NextResponse.json({
    autoConfirmed: confirmed,
    payoutsReleased: released,
    timestamp: now.toISOString(),
  });
}
