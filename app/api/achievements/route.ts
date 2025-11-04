import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db/connect";
import Achievement from "@/lib/models/Achievement";

export async function GET(req: NextRequest) {
  await connectToDB();

  const achievements = await Achievement.find({ isActive: true })
    .sort({ tier: 1, points: 1 })
    .lean();

  const groupedByCategory = achievements.reduce(
    (acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = [];
      }
      acc[achievement.category].push(achievement);
      return acc;
    },
    {} as Record<string, typeof achievements>
  );

  return NextResponse.json({
    achievements,
    groupedByCategory,
    total: achievements.length,
  });
}
