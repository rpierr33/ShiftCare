import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Admin emails from env — parsed once at module load
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

/**
 * POST /api/admin/deactivate-user
 * Deactivates or reactivates a user account. Admin-only.
 * BUG FIX: Replaced requireAdmin() (which uses redirect()) with direct auth check.
 * redirect() throws a special Next.js error that gets caught by the outer try/catch,
 * causing a 500 response instead of a proper 403 in API route context.
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate and verify admin role via session (not requireAdmin which uses redirect)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }
    const admin = session.user as { id: string; email: string; role: string };
    if (!ADMIN_EMAILS.includes(admin.email.toLowerCase())) {
      return NextResponse.json({ success: false, error: "Forbidden: admin access required." }, { status: 403 });
    }

    // Parse and validate the request body
    const { userId, action } = await req.json();

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    // Only allow known actions
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

    // Verify the target user exists before updating
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

    // Set isActive based on the requested action
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
