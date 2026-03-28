import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";

// Admin emails from env — parsed once at module load
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

/**
 * POST /api/admin/verify-provider
 * Approves or rejects a provider's verification request. Admin-only.
 *
 * BUG FIX: Replaced requireAdmin() with direct auth check for API route context.
 * BUG FIX: Removed misleading `userId` parameter — notifications are sent to
 * profile.userId (the actual owner), not an arbitrary passed userId.
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate and verify admin role
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }
    const admin = session.user as { id: string; email: string };
    if (!ADMIN_EMAILS.includes(admin.email.toLowerCase())) {
      return NextResponse.json({ success: false, error: "Forbidden: admin access required." }, { status: 403 });
    }

    // Parse and validate required fields
    const { providerId, action, reason } = await req.json();

    if (!providerId || !action) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    // Only allow known actions
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action." },
        { status: 400 }
      );
    }

    // Fetch the provider profile to verify existence
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
      // Mark the provider as compliance-complete
      await db.providerProfile.update({
        where: { id: providerId },
        data: { complianceStatus: "COMPLETE" },
      });

      // Notify the provider owner (using profile.userId, not a passed param)
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
      // Rejection requires a reason so the provider knows what to fix
      if (!reason?.trim()) {
        return NextResponse.json(
          { success: false, error: "Rejection reason is required." },
          { status: 400 }
        );
      }

      // Keep status as PENDING so the provider can fix issues and resubmit
      await sendNotification({
        userId: profile.userId,
        type: "PROVIDER_VERIFICATION_REJECTED",
        title: "Verification Needs Attention",
        body: `Your account verification needs attention. Reason: ${reason.trim()}. Please update your information and resubmit.`,
        channels: ["inapp", "email"],
      });

      return NextResponse.json({ success: true });
    }

    // Unreachable due to validation above, but defensive
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
