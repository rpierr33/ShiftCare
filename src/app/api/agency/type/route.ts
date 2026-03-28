import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getSessionUser();
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

    const isSubscribed =
      profile?.subscription?.status === "ACTIVE" &&
      (profile.subscription.plan === "STARTER" || profile.subscription.plan === "PROFESSIONAL");

    return NextResponse.json({
      providerType: profile?.providerType || "AGENCY",
      isSubscribed: !!isSubscribed,
      plan: profile?.subscription?.plan || "FREE",
    });
  } catch {
    return NextResponse.json({ providerType: "AGENCY", isSubscribed: false, plan: "FREE" });
  }
}
