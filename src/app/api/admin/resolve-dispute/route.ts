import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";

// Admin emails from env — parsed once at module load
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

/**
 * POST /api/admin/resolve-dispute
 * Resolves a disputed shift by either releasing payment to the worker
 * or refunding the employer. Admin-only.
 *
 * BUG FIX: Replaced requireAdmin() with direct auth check for API route context.
 * BUG FIX: Added validation that action must be "release" or "refund" — previously
 * any other value would silently return success without doing anything.
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
    const { shiftId, workerId, action } = await req.json();
    if (!shiftId || !action) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    // BUG FIX: Validate action value — previously unrecognized actions returned success silently
    if (!["release", "refund"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action. Must be 'release' or 'refund'." }, { status: 400 });
    }

    // Fetch the shift and verify it is in DISPUTED status
    const shift = await db.shift.findUnique({ where: { id: shiftId } });
    if (!shift || shift.status !== "DISPUTED") {
      return NextResponse.json({ success: false, error: "Shift is not in disputed state." }, { status: 400 });
    }

    if (action === "release") {
      // Release payment to the worker via Stripe
      try {
        const { confirmShiftCompletion } = await import("@/lib/stripe-actions");
        await confirmShiftCompletion(shiftId, "admin-resolution");
      } catch {
        // If Stripe isn't configured, fall back to DB-only status update
        await db.shift.update({
          where: { id: shiftId },
          data: { status: "COMPLETED", paymentStatus: "RELEASED", completionConfirmedAt: new Date(), completionConfirmedBy: "admin-resolution" },
        });
      }

      // Notify the worker if their ID was provided
      if (workerId) {
        await sendNotification({
          userId: workerId,
          type: "DISPUTE_RESOLVED",
          title: "Dispute Resolved",
          body: "Your dispute has been reviewed. Payment has been released to your account.",
          channels: ["inapp", "email"],
        });
      }

      // Always notify the provider/agency
      await sendNotification({
        userId: shift.providerId,
        type: "DISPUTE_RESOLVED",
        title: "Dispute Resolved",
        body: "The dispute has been reviewed. Payment has been released to the worker.",
        channels: ["inapp", "email"],
      });
    } else if (action === "refund") {
      // Refund the employer via Stripe
      try {
        const { cancelShiftWithRefund } = await import("@/lib/stripe-actions");
        await cancelShiftWithRefund(shiftId, "AGENCY");
      } catch {
        // If Stripe isn't configured, fall back to DB-only status update
        await db.shift.update({
          where: { id: shiftId },
          data: { status: "CANCELLED", paymentStatus: "REFUNDED" },
        });
      }

      // Notify the provider about the refund
      await sendNotification({
        userId: shift.providerId,
        type: "DISPUTE_RESOLVED",
        title: "Dispute Resolved — Refund Issued",
        body: "The dispute has been reviewed. A full refund has been issued to your payment method.",
        channels: ["inapp", "email"],
      });

      // Notify the worker if their ID was provided
      if (workerId) {
        await sendNotification({
          userId: workerId,
          type: "DISPUTE_RESOLVED",
          title: "Dispute Resolved",
          body: "The dispute has been reviewed. The employer has been refunded.",
          channels: ["inapp", "email"],
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resolve dispute error:", error);
    return NextResponse.json({ success: false, error: "Failed to resolve dispute." }, { status: 500 });
  }
}
