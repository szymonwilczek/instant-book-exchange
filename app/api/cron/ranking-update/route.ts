import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db/connect";
import {
  updateAllUsers,
  recalculateRankings,
  applyDecaySystem,
} from "@/lib/ranking/updater";

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // czy request z Vercel Cron
      const vercelSignature = req.headers.get("x-vercel-signature");
      if (
        !vercelSignature &&
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
      ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    await connectToDB();

    // 1. update wszystkich uzytkownikow
    const usersUpdated = await updateAllUsers();

    // 2. decay system
    const usersDecayed = await applyDecaySystem();

    // 3. rankingi
    await recalculateRankings();

    const duration = Date.now() - startTime;

    console.log(`[CRON] Ranking update completed:`, {
      usersUpdated,
      usersDecayed,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      usersUpdated,
      usersDecayed,
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Ranking update failed:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
