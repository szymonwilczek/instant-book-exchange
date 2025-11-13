import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db/connect";
import UserRanking, { IUserRanking } from "@/lib/models/UserRanking";
import User, { IUser } from "@/lib/models/User";
import { LeaderboardEntry } from "@/lib/types/ranking";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 },
      );
    }

    const users = (await User.find({
      username: { $regex: query, $options: "i" },
    })
      .limit(20)
      .lean()) as IUser[];

    if (users.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // fetchowanie rankingu
    const userIds = users.map((u) => u._id);
    const rankings = (await UserRanking.find({
      userId: { $in: userIds },
    }).lean()) as IUserRanking[];

    const results: LeaderboardEntry[] = [];

    for (const user of users) {
      const ranking = rankings.find(
        (r) => r.userId.toString() === user._id.toString(),
      );

      if (!ranking) continue;

      results.push({
        userId: user._id.toString(),
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

    results.sort((a, b) => a.rank - b.rank);

    return NextResponse.json({ users: results });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
