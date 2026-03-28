import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * DELETE /api/push/unsubscribe
 * Removes a push notification subscription for the authenticated user.
 * Scoped to the user's own subscriptions to prevent cross-user deletion.
 */
export async function DELETE(req: Request) {
  // Authenticate — require a valid session with user ID
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse the endpoint identifier from the request body
    const body = await req.json();
    const { endpoint } = body;

    // Validate required field
    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    // Delete only subscriptions matching both endpoint AND user ID (security: prevents deleting other users' subs)
    await db.pushSubscription.deleteMany({
      where: { endpoint, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
  }
}
