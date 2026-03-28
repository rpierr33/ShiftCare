import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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

    if (!profile) {
      return NextResponse.json({});
    }

    // Return profile data with null values converted to empty strings for form compatibility
    const data: Record<string, string> = {};
    for (const [key, value] of Object.entries(profile)) {
      data[key] = value ?? "";
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
