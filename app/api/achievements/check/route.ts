import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Achievement from "@/lib/models/Achievement";
import UserAchievement from "@/lib/models/UserAchievement";
import User from "@/lib/models/User";
import Transaction from "@/lib/models/Transaction";
import Review from "@/lib/models/Review";
import mongoose from "mongoose";

type EventType =
  | "transaction_completed"
  | "review_received"
  | "book_added"
  | "login";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { event, userId } = (await req.json()) as {
    event: EventType;
    userId?: string;
  };

  await connectToDB();

  const targetUserId =
    userId || (await User.findOne({ email: session.user.email }))._id;

  if (!targetUserId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // wszystkie aktywne osiagniecia
  const allAchievements = await Achievement.find({ isActive: true }).lean();

  // aktualne osiagniecia uzytkownika
  const userAchievements = await UserAchievement.find({
    userId: targetUserId,
  }).lean();

  const newlyUnlocked = [];
  const progressUpdates = [];

  // obliczenie statystyk uzytkownika 
  const completedTransactions = await Transaction.countDocuments({
    $or: [{ initiator: targetUserId }, { receiver: targetUserId }],
    status: "completed",
  });

  const reviews = await Review.find({ reviewedUser: targetUserId }).lean();
  const positiveReviews = reviews.filter((r) => r.rating >= 4).length;

  // sprawdzanie kazdeg osiagniecia
  for (const achievement of allAchievements) {
    const existingUserAchievement = userAchievements.find(
      (ua) => ua.achievementId.toString() === achievement._id.toString()
    );

    // jesli odblokowane -> pomin
    if (existingUserAchievement?.unlockedAt) continue;

    let currentProgress = 0;
    let targetProgress = 0;
    let unlocked = false;

    // TRADING
    if (achievement.requirement.completedTransactions) {
      targetProgress = achievement.requirement.completedTransactions;
      currentProgress = completedTransactions;
      unlocked = currentProgress >= targetProgress;
    }

    // REPUTATION - Average Rating
    if (
      achievement.requirement.averageRating &&
      achievement.requirement.minReviews
    ) {
      targetProgress = achievement.requirement.minReviews;
      currentProgress = reviews.length;
      unlocked =
        reviews.length >= achievement.requirement.minReviews &&
        user.averageRating >= achievement.requirement.averageRating;
    }

    // REPUTATION - Positive Reviews
    if (achievement.requirement.positiveReviews) {
      targetProgress = achievement.requirement.positiveReviews;
      currentProgress = positiveReviews;
      unlocked = currentProgress >= targetProgress;
    }

    if (existingUserAchievement) {
      if (existingUserAchievement.progress !== currentProgress || unlocked) {
        await UserAchievement.findByIdAndUpdate(existingUserAchievement._id, {
          progress: currentProgress,
          ...(unlocked && { unlockedAt: new Date() }),
        });

        if (unlocked) {
          newlyUnlocked.push({
            ...achievement,
            progress: currentProgress,
            target: targetProgress,
          });

          // punkty bonusowe
          user.points += achievement.points;
          await user.save();
        } else {
          progressUpdates.push({
            achievementId: achievement._id,
            id: achievement.id,
            name: achievement.name,
            current: currentProgress,
            target: targetProgress,
          });
        }
      }
    } else {
      // nowy UserAchievement
      await UserAchievement.create({
        userId: targetUserId,
        achievementId: achievement._id,
        progress: currentProgress,
        ...(unlocked && { unlockedAt: new Date() }),
      });

      if (unlocked) {
        newlyUnlocked.push({
          ...achievement,
          progress: currentProgress,
          target: targetProgress,
        });

        // punkty bonusowe
        user.points += achievement.points;
        await user.save();
      } else {
        progressUpdates.push({
          achievementId: achievement._id,
          id: achievement.id,
          name: achievement.name,
          current: currentProgress,
          target: targetProgress,
        });
      }
    }
  }

  return NextResponse.json({
    newlyUnlocked,
    progressUpdates,
    message:
      newlyUnlocked.length > 0
        ? `Unlocked ${newlyUnlocked.length} achievement(s)!`
        : "No new achievements",
  });
}
