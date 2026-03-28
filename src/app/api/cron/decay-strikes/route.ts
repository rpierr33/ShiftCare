import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const NINETY_DAYS_AGO = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  let decayed = 0;

  // Find users who have active strikes where the most recent is older than 90 days
  const usersWithStrikes = await db.strike.groupBy({
    by: ["userId"],
    where: { decayedAt: null },
    _max: { createdAt: true },
    _count: true,
  });

  for (const group of usersWithStrikes) {
    const latestStrike = group._max.createdAt;
    if (!latestStrike || latestStrike > NINETY_DAYS_AGO) continue;

    // 90 days of clean behavior — decay the oldest active strike
    const oldestActive = await db.strike.findFirst({
      where: { userId: group.userId, decayedAt: null },
      orderBy: { createdAt: "asc" },
    });

    if (oldestActive) {
      await db.strike.update({
        where: { id: oldestActive.id },
        data: { decayedAt: new Date() },
      });
      decayed++;
    }

    // Check if all strikes are now decayed — un-suspend if so
    const remainingActive = await db.strike.count({
      where: { userId: group.userId, decayedAt: null },
    });

    if (remainingActive < 3) {
      await db.user.update({
        where: { id: group.userId },
        data: { isSuspended: false, suspendedAt: null },
      });
    }
  }

  return NextResponse.json({ decayed, timestamp: new Date().toISOString() });
}
