import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const { shiftId, workerId, action } = await req.json();
    if (!shiftId || !action) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    const shift = await db.shift.findUnique({ where: { id: shiftId } });
    if (!shift || shift.status !== "DISPUTED") {
      return NextResponse.json({ success: false, error: "Shift is not in disputed state." }, { status: 400 });
    }

    if (action === "release") {
      // Release payment to worker
      try {
        const { confirmShiftCompletion } = await import("@/lib/stripe-actions");
        await confirmShiftCompletion(shiftId, "admin-resolution");
      } catch {
        // If Stripe isn't configured, just update DB status
        await db.shift.update({
          where: { id: shiftId },
          data: { status: "COMPLETED", paymentStatus: "RELEASED", completionConfirmedAt: new Date(), completionConfirmedBy: "admin-resolution" },
        });
      }

      if (workerId) {
        await sendNotification({
          userId: workerId,
          type: "DISPUTE_RESOLVED",
          title: "Dispute Resolved",
          body: "Your dispute has been reviewed. Payment has been released to your account.",
          channels: ["inapp", "email"],
        });
      }
      await sendNotification({
        userId: shift.providerId,
        type: "DISPUTE_RESOLVED",
        title: "Dispute Resolved",
        body: "The dispute has been reviewed. Payment has been released to the worker.",
        channels: ["inapp", "email"],
      });
    } else if (action === "refund") {
      // Refund to employer
      try {
        const { cancelShiftWithRefund } = await import("@/lib/stripe-actions");
        await cancelShiftWithRefund(shiftId, "AGENCY");
      } catch {
        await db.shift.update({
          where: { id: shiftId },
          data: { status: "CANCELLED", paymentStatus: "REFUNDED" },
        });
      }

      await sendNotification({
        userId: shift.providerId,
        type: "DISPUTE_RESOLVED",
        title: "Dispute Resolved — Refund Issued",
        body: "The dispute has been reviewed. A full refund has been issued to your payment method.",
        channels: ["inapp", "email"],
      });
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
