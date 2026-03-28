import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * GET /api/agency/type
 * Returns the provider's type, subscription status, and current plan.
 *
 * BUG FIX: Replaced getSessionUser() with direct auth check. Previously, auth
 * failures returned 200 with default data instead of 401, hiding real errors.
 */
export async function GET() {
  // Authenticate the request
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = session.user as { id: string; role: string };

    // Fetch provider profile with subscription details
    const profile = await db.providerProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        providerType: true,
        subscription: {
          select: { plan: true, status: true },
        },
      },
    });

    // Determine if the provider has an active paid subscription
    const isSubscribed =
      profile?.subscription?.status === "ACTIVE" &&
      (profile.subscription.plan === "STARTER" || profile.subscription.plan === "PROFESSIONAL");

    return NextResponse.json({
      providerType: profile?.providerType || "AGENCY",
      isSubscribed: !!isSubscribed,
      plan: profile?.subscription?.plan || "FREE",
    });
  } catch (error) {
    console.error("Agency type GET error:", error);
    return NextResponse.json({ error: "Failed to fetch provider type." }, { status: 500 });
  }
}
