import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getSessionUser();
    const result = await db.rating.aggregate({
      where: { rateeId: user.id },
      _avg: { score: true },
      _count: true,
    });
    return NextResponse.json({
      average: result._avg.score ?? 0,
      count: result._count,
    });
  } catch {
    return NextResponse.json({ average: 0, count: 0 });
  }
}
