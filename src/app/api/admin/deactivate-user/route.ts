import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    const { userId, action } = await req.json();

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    if (!["deactivate", "reactivate"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action." },
        { status: 400 }
      );
    }

    // Prevent admin from deactivating themselves
    if (userId === admin.id && action === "deactivate") {
      return NextResponse.json(
        { success: false, error: "You cannot deactivate your own account." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, isActive: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    await db.user.update({
      where: { id: userId },
      data: { isActive: action === "reactivate" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Deactivate user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user status." },
      { status: 500 }
    );
  }
}
