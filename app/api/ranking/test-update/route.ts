import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db/connect";
import {
  updateSingleUser,
  updateAllUsers,
  recalculateRankings,
} from "@/lib/ranking/updater";
import UserRanking from "@/lib/models/UserRanking";
import { UserRankingData } from "@/lib/types/ranking";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const mode = searchParams.get("mode") || "single";

    if (mode === "all") {
      const updated = await updateAllUsers();
      await recalculateRankings();

      return NextResponse.json({
        success: true,
        message: "Updated all user rankings",
        usersUpdated: updated,
        timestamp: new Date().toISOString(),
      });
    } else if (userId) {
      await updateSingleUser(userId);

      const ranking = (await UserRanking.findOne({ userId }).lean()) as UserRankingData | null;

      if (!ranking) {
        return NextResponse.json(
          { error: "Ranking not found after update" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Updated user ranking",
        userId,
        ranking: {
          totalScore: ranking.totalScore,
          tier: ranking.tier,
          rank: ranking.rank,
          scores: ranking.scores,
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        { error: "Missing userId parameter or use mode=all" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Test update error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 },
    );
  }
}
