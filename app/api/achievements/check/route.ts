import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import UserAchievement from "@/lib/models/UserAchievement";
import User from "@/lib/models/User";
import Transaction from "@/lib/models/Transaction";
import Review from "@/lib/models/Review";
import Book from "@/lib/models/Book";
import Conversation from "@/lib/models/Conversation";
import LoginStreak from "@/lib/models/LoginStreak";
import Achievement, { IAchievement } from "@/lib/models/Achievement";

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

  const userEmail = session.user?.email;
  if (!userEmail) {
    return NextResponse.json(
      { error: "User email not found" },
      { status: 401 }
    );
  }

  const targetUserId = userId || (await User.findOne({ email: userEmail }))._id;

  if (!targetUserId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // wszystkie aktywne osiagniecia
  const allAchievements = (await Achievement.find({
    isActive: true,
  }).lean()) as IAchievement[];

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

  const freeGiveaways = await Transaction.countDocuments({
    receiver: targetUserId,
    status: "completed",
    offeredBooks: { $size: 0 },
  });

  const detailedReviews = await Review.countDocuments({
    reviewer: targetUserId,
    comment: { $exists: true, $ne: "" },
    $expr: { $gte: [{ $strLenCP: "$comment" }, 50] },
  });

  const totalBooksAdded = await Book.countDocuments({
    owner: targetUserId,
  });

  const conversationsStarted = await Conversation.countDocuments({
    participants: targetUserId,
  });

  const loginStreakDoc = await LoginStreak.findOne({ user: targetUserId });
  const loginStreak = loginStreakDoc ? loginStreakDoc.currentStreak : 0;

  // sprawdzanie kazdeg osiagniecia
  for (const achievement of allAchievements) {
    const existingUserAchievement = userAchievements.find(
      (ua) => ua.achievementId.toString() === achievement._id.toString()
    );

    // jesli odblokowane -> pomin
    if (existingUserAchievement?.unlockedAt) continue;

    // pomijanie jesli brak requirement
    if (!achievement.requirement) continue;

    // event-specific filtrowanie
    const shouldCheck =
      (event === "transaction_completed" &&
        (achievement.requirement.completedTransactions ||
          achievement.requirement.freeGiveaways)) ||
      (event === "review_received" &&
        (achievement.requirement.averageRating ||
          achievement.requirement.positiveReviews ||
          achievement.requirement.detailedReviews)) ||
      (event === "book_added" && achievement.requirement.totalBooksAdded) ||
      (event === "login" &&
        (achievement.requirement.loginStreak ||
          achievement.requirement.joinedBefore)) ||
      achievement.requirement.conversationsStarted;

    if (!shouldCheck) continue;

    let currentProgress = 0;
    let targetProgress = 0;
    let unlocked = false;

    // TRADING
    if (achievement.requirement.completedTransactions) {
      targetProgress = achievement.requirement.completedTransactions;
      currentProgress = completedTransactions;
      unlocked = currentProgress >= targetProgress;
    }

    // COMMUNITY - Free Giveaways
    if (achievement.requirement.freeGiveaways) {
      targetProgress = achievement.requirement.freeGiveaways;
      currentProgress = freeGiveaways;
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

    // COMMUNITY - Detailed Reviews
    if (achievement.requirement.detailedReviews) {
      targetProgress = achievement.requirement.detailedReviews;
      currentProgress = detailedReviews;
      unlocked = currentProgress >= targetProgress;
    }

    // COLLECTION - Total Books Added
    if (achievement.requirement.totalBooksAdded) {
      targetProgress = achievement.requirement.totalBooksAdded;
      currentProgress = totalBooksAdded;
      unlocked = currentProgress >= targetProgress;
    }

    // COMMUNITY - Conversations Started
    if (achievement.requirement.conversationsStarted) {
      targetProgress = achievement.requirement.conversationsStarted;
      currentProgress = conversationsStarted;
      unlocked = currentProgress >= targetProgress;
    }

    // ACTIVITY - Login Streak
    if (achievement.requirement.loginStreak) {
      targetProgress = achievement.requirement.loginStreak;
      currentProgress = loginStreak;
      unlocked = currentProgress >= targetProgress;
    }

    // SPECIAL - Joined Before
    if (achievement.requirement.joinedBefore) {
      unlocked =
        user.createdAt < new Date(achievement.requirement.joinedBefore);
      targetProgress = 1;
      currentProgress = unlocked ? 1 : 0;
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
            nameKey: achievement.nameKey,
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
          nameKey: achievement.nameKey,
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
