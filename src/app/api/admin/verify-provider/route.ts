import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const { providerId, userId, action, reason } = await req.json();

    if (!providerId || !userId || !action) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action." },
        { status: 400 }
      );
    }

    const profile = await db.providerProfile.findUnique({
      where: { id: providerId },
      select: { id: true, complianceStatus: true, companyName: true, userId: true },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Provider profile not found." },
        { status: 404 }
      );
    }

    if (action === "approve") {
      await db.providerProfile.update({
        where: { id: providerId },
        data: { complianceStatus: "COMPLETE" },
      });

      await sendNotification({
        userId: profile.userId,
        type: "PROVIDER_VERIFIED",
        title: "Account Verified",
        body: "Your account has been verified. You can now post shifts.",
        channels: ["inapp", "email"],
      });

      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      if (!reason?.trim()) {
        return NextResponse.json(
          { success: false, error: "Rejection reason is required." },
          { status: 400 }
        );
      }

      // Keep PENDING so they can fix and resubmit
      await sendNotification({
        userId: profile.userId,
        type: "PROVIDER_VERIFICATION_REJECTED",
        title: "Verification Needs Attention",
        body: `Your account verification needs attention. Reason: ${reason.trim()}. Please update your information and resubmit.`,
        channels: ["inapp", "email"],
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Verify provider error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process verification." },
      { status: 500 }
    );
  }
}
