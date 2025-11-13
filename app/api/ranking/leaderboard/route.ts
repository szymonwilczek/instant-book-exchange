import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db/connect";
import UserRanking from "@/lib/models/UserRanking";
import User, { IUser } from "@/lib/models/User";
import { LeaderboardEntry, LeaderboardResponse } from "@/lib/types/ranking";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");

    const skip = (page - 1) * limit;

    const rankings = await UserRanking.find({})
      .sort({ rank: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await UserRanking.countDocuments({});

    const leaderboard: LeaderboardEntry[] = [];

    for (const ranking of rankings) {
      const user = (await User.findById(ranking.userId).lean()) as IUser | null;
      if (user) {
        leaderboard.push({
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
        });
      }
    }

    const response: LeaderboardResponse = {
      users: leaderboard,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
