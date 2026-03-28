import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/cron/decay-strikes
 * Cron job that decays (removes) the oldest active strike for users
 * who have had 90 days of clean behavior (no new strikes).
 * If remaining active strikes drop below 3, the user is un-suspended.
 *
 * Protected by CRON_SECRET bearer token.
 * Idempotent: running twice in the same day will not double-decay because
 * the oldest strike is already marked as decayed after the first run.
 */
export async function GET(req: Request) {
  // Validate cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const NINETY_DAYS_AGO = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    let decayed = 0;

    // Group active (non-decayed) strikes by user, finding the most recent strike date
    const usersWithStrikes = await db.strike.groupBy({
      by: ["userId"],
      where: { decayedAt: null },
      _max: { createdAt: true },
      _count: true,
    });

    for (const group of usersWithStrikes) {
      const latestStrike = group._max.createdAt;

      // Skip if no strikes found or if the most recent strike is within the 90-day window
      if (!latestStrike || latestStrike > NINETY_DAYS_AGO) continue;

      // 90 days of clean behavior — decay the oldest active strike for this user
      const oldestActive = await db.strike.findFirst({
        where: { userId: group.userId, decayedAt: null },
        orderBy: { createdAt: "asc" },
      });

      if (oldestActive) {
        // Mark the strike as decayed with the current timestamp
        await db.strike.update({
          where: { id: oldestActive.id },
          data: { decayedAt: new Date() },
        });
        decayed++;
      }

      // Check remaining active strikes — un-suspend if below the suspension threshold
      const remainingActive = await db.strike.count({
        where: { userId: group.userId, decayedAt: null },
      });

      // Un-suspend the user if they now have fewer than 3 active strikes
      if (remainingActive < 3) {
        await db.user.update({
          where: { id: group.userId },
          data: { isSuspended: false, suspendedAt: null },
        });
      }
    }

    return NextResponse.json({ decayed, timestamp: new Date().toISOString() });
  } catch (error) {
    // Top-level catch for query failures
    console.error("Decay strikes cron error:", error);
    return NextResponse.json({ error: "Cron job failed." }, { status: 500 });
  }
}
