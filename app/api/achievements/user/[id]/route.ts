import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db/connect";
import Achievement, { IAchievement } from "@/lib/models/Achievement";
import UserAchievement from "@/lib/models/UserAchievement";
import mongoose from "mongoose";

const tierOrder = ["bronze", "silver", "gold", "platinum"];

interface AchievementWithProgress extends IAchievement {
  progress: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

interface SeriesGroup {
  seriesId: string;
  seriesName: string;
  category: string;
  tiers: AchievementWithProgress[];
  currentTierIndex: number;
  nextTierIndex: number;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  await connectToDB();

  const allAchievements = (await Achievement.find({
    isActive: true,
  }).lean()) as IAchievement[];
  const userAchievements = await UserAchievement.find({
    userId: id,
  })
    .populate("achievementId")
    .lean();

  const achievementsWithProgress: AchievementWithProgress[] =
    allAchievements.map((achievement) => {
      const userAchievement = userAchievements.find(
        (ua) =>
          (
            ua.achievementId as { _id: mongoose.Types.ObjectId }
          )._id.toString() === achievement._id.toString()
      );

      return {
        ...achievement,
        progress: userAchievement?.progress || 0,
        unlocked: !!userAchievement?.unlockedAt,
        unlockedAt: userAchievement?.unlockedAt,
      } as AchievementWithProgress;
    });

  const groupedBySeries = achievementsWithProgress.reduce(
    (acc, achievement) => {
      if (!acc[achievement.seriesId]) {
        acc[achievement.seriesId] = {
          seriesId: achievement.seriesId,
          seriesName: achievement.seriesNameKey,
          category: achievement.category,
          tiers: [],
          currentTierIndex: -1,
          nextTierIndex: -1,
        };
      }
      acc[achievement.seriesId].tiers.push(achievement);
      return acc;
    },
    {} as Record<string, SeriesGroup>
  );

  const series = Object.values(groupedBySeries).map((s) => {
    s.tiers.sort(
      (a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier)
    );

    const unlockedTiers = s.tiers.filter((t) => t.unlocked);
    s.currentTierIndex =
      unlockedTiers.length > 0 ? unlockedTiers.length - 1 : -1;

    const lockedTiers = s.tiers.filter((t) => !t.unlocked);
    if (lockedTiers.length > 0) {
      s.nextTierIndex = s.tiers.findIndex((t) => t.id === lockedTiers[0].id);
    }

    return s;
  });

  // grupowanie serii po kategoriach
  const groupedByCategory = series.reduce(
    (acc, s) => {
      if (!acc[s.category]) {
        acc[s.category] = [];
      }
      acc[s.category].push(s);
      return acc;
    },
    {} as Record<string, typeof series>
  );

  // statystyki
  const unlockedCount = achievementsWithProgress.filter(
    (a) => a.unlocked
  ).length;
  const totalPoints = achievementsWithProgress
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);

  return NextResponse.json({
    series,
    groupedByCategory,
    stats: {
      unlockedCount,
      totalCount: allAchievements.length,
      totalPoints,
      progress: ((unlockedCount / allAchievements.length) * 100).toFixed(1),
    },
  });
}
