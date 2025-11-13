import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db/connect";
import UserRanking from "@/lib/models/UserRanking";
import User, { IUser } from "@/lib/models/User";
import { LeaderboardEntry, UserRankingData } from "@/lib/types/ranking";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    await connectToDB();

    const { userId } = params;

    const ranking = (await UserRanking.findOne({
      userId,
    }).lean()) as UserRankingData;
    if (!ranking) {
      return NextResponse.json({ error: "Ranking not found" }, { status: 404 });
    }

    const user = (await User.findById(userId).lean()) as IUser;
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result: LeaderboardEntry = {
      userId: ranking.userId.toString(),
      username: user.username || "Unknown",
      email: user.email || "",
      profileImage: user.profileImage,
      totalScore: ranking.totalScore,
      scores: ranking.scores,
      rank: ranking.rank,
      tier: ranking.tier,
      previousRank: ranking.previousRank,
      stats: ranking.stats,
      weeklyExchanges: ranking.weeklyExchanges,
      weeklyReviews: ranking.weeklyReviews,
      lastActivity: ranking.lastActivity,
      lastCalculated: ranking.lastCalculated,
      createdAt: ranking.createdAt,
      updatedAt: ranking.updatedAt,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching user ranking:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
