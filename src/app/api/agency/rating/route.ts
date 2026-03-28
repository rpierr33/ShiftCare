import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * GET /api/agency/rating
 * Returns the average rating and count for the authenticated user.
 *
 * BUG FIX: Replaced getSessionUser() with direct auth check to avoid redirect()
 * throwing in API route context. Previously, auth failures returned 200 with
 * {average: 0, count: 0} instead of a proper 401, hiding the real error.
 */
export async function GET() {
  // Authenticate the request
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Aggregate ratings where this user is the ratee
    const result = await db.rating.aggregate({
      where: { rateeId: session.user.id },
      _avg: { score: true },
      _count: true,
    });

    return NextResponse.json({
      average: result._avg.score ?? 0,
      count: result._count,
    });
  } catch (error) {
    // Log the actual error for debugging
    console.error("Agency rating GET error:", error);
    return NextResponse.json({ error: "Failed to fetch rating." }, { status: 500 });
  }
}
