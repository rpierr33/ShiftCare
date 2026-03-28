import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * GET /api/agency/profile
 * Returns the provider's profile data with nulls converted to empty strings
 * for form compatibility.
 *
 * BUG FIX: Replaced getSessionUser() (which uses redirect()) with direct auth check.
 * redirect() throws a special error in API route context, causing the catch block
 * to return a 500 instead of a proper 401/403.
 */
export async function GET() {
  try {
    // Authenticate the request
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id: string; role: string };

    // Only providers can access this endpoint
    if (user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch provider profile fields needed for the settings form
    const profile = await db.providerProfile.findUnique({
      where: { userId: user.id },
      select: {
        companyName: true,
        description: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        phone: true,
        website: true,
        npiNumber: true,
        einNumber: true,
        licenseNumber: true,
        licenseState: true,
        contactPerson: true,
        contactTitle: true,
        contactPersonEmail: true,
        contactPersonPhone: true,
      },
    });

    // Return empty object if no profile exists yet
    if (!profile) {
      return NextResponse.json({});
    }

    // Convert null values to empty strings for form field compatibility
    const data: Record<string, string> = {};
    for (const [key, value] of Object.entries(profile)) {
      data[key] = value ?? "";
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Agency profile GET error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
