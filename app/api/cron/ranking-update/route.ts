import { NextRequest, NextResponse } from "next/server";
import { dailyRankingUpdate } from "@/lib/cron/ranking-update";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await dailyRankingUpdate();

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Ranking update failed",
          details: result.error,
          timestamp: result.timestamp,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      usersUpdated: result.usersUpdated,
      usersDecayed: result.usersDecayed,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error("Cron endpoint error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
