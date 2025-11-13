import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db/connect";
import UserRanking, { IUserRanking } from "@/lib/models/UserRanking";
import User, { IUser } from "@/lib/models/User";
import { RankingComparison, LeaderboardEntry } from "@/lib/types/ranking";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const user1Id = searchParams.get("user1");
    const user2Id = searchParams.get("user2");

    if (!user1Id || !user2Id) {
      return NextResponse.json(
        { error: "Both user1 and user2 parameters are required" },
        { status: 400 },
      );
    }

    if (user1Id === user2Id) {
      return NextResponse.json(
        { error: "Cannot compare user with themselves" },
        { status: 400 },
      );
    }

    const ranking1 = (await UserRanking.findOne({ userId: user1Id }).lean()) as IUserRanking | null;
    const ranking2 = (await UserRanking.findOne({ userId: user2Id }).lean()) as IUserRanking | null;

    if (!ranking1 || !ranking2) {
      return NextResponse.json(
        { error: "One or both users not found" },
        { status: 404 },
      );
    }

    const user1 = (await User.findById(user1Id).lean()) as IUser | null;
    const user2 = (await User.findById(user2Id).lean()) as IUser | null;

    if (!user1 || !user2) {
      return NextResponse.json(
        { error: "User data not found" },
        { status: 404 },
      );
    }

    const user1Data: LeaderboardEntry = {
      userId: ranking1.userId.toString(),
      username: user1.username || "Unknown",
      email: user1.email || "",
      profileImage: user1.profileImage,
      totalScore: ranking1.totalScore,
      scores: ranking1.scores,
      rank: ranking1.rank,
      tier: ranking1.tier,
      previousRank: ranking1.previousRank,
      stats: ranking1.stats,
      weeklyExchanges: ranking1.weeklyExchanges,
      weeklyReviews: ranking1.weeklyReviews,
      lastActivity: ranking1.lastActivity,
      lastCalculated: ranking1.lastCalculated,
      createdAt: ranking1.createdAt,
      updatedAt: ranking1.updatedAt,
    };

    const user2Data: LeaderboardEntry = {
      userId: ranking2.userId.toString(),
      username: user2.username || "Unknown",
      email: user2.email || "",
      profileImage: user2.profileImage,
      totalScore: ranking2.totalScore,
      scores: ranking2.scores,
      rank: ranking2.rank,
      tier: ranking2.tier,
      previousRank: ranking2.previousRank,
      stats: ranking2.stats,
      weeklyExchanges: ranking2.weeklyExchanges,
      weeklyReviews: ranking2.weeklyReviews,
      lastActivity: ranking2.lastActivity,
      lastCalculated: ranking2.lastCalculated,
      createdAt: ranking2.createdAt,
      updatedAt: ranking2.updatedAt,
    };

    const comparison: RankingComparison = {
      user1: user1Data,
      user2: user2Data,
      differences: {
        scoreDiff: ranking1.totalScore - ranking2.totalScore,
        rankDiff: ranking1.rank - ranking2.rank,
        scoreBreakdown: {
          trading: ranking1.scores.trading - ranking2.scores.trading,
          reputation: ranking1.scores.reputation - ranking2.scores.reputation,
          community: ranking1.scores.community - ranking2.scores.community,
          activity: ranking1.scores.activity - ranking2.scores.activity,
          quality: ranking1.scores.quality - ranking2.scores.quality,
        },
      },
    };

    return NextResponse.json(comparison);
  } catch (error) {
    console.error("Error comparing users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
