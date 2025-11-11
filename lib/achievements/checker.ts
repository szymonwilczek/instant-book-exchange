import connectToDB from "@/lib/db/connect";
import Achievement, { IAchievement } from "@/lib/models/Achievement";
import UserAchievement from "@/lib/models/UserAchievement";
import User from "@/lib/models/User";
import Transaction from "@/lib/models/Transaction";
import Review from "@/lib/models/Review";
import Book from "@/lib/models/Book";
import Conversation from "@/lib/models/Conversation";
import LoginStreak, { ILoginStreak } from "@/lib/models/LoginStreak";

interface ProgressUpdate {
  achievementId: string;
  progress: number;
  target: number;
}

export async function checkAchievements(userId: string) {
  await connectToDB();

  const user = await User.findById(userId);
  if (!user) return { newlyUnlocked: [], progressUpdates: [] };

  const allAchievements = (await Achievement.find({
    isActive: true,
  }).lean()) as IAchievement[];
  const userAchievements = await UserAchievement.find({ userId }).lean();

  const newlyUnlocked = [];
  const progressUpdates: ProgressUpdate[] = [];

  // === STATYSTYKI UŻYTKOWNIKA ===

  // 1. COMPLETED TRANSACTIONS
  const completedTransactions = await Transaction.countDocuments({
    $or: [{ initiator: userId }, { receiver: userId }],
    status: "completed",
  });

  // 2. FREE GIVEAWAYS
  const freeGiveaways = await Transaction.countDocuments({
    receiver: userId,
    status: "completed",
    offeredBooks: { $size: 0 },
  });

  // 3. REVIEWS RECEIVED
  const reviews = await Review.find({ reviewedUser: userId }).lean();
  const positiveReviews = reviews.filter((r) => r.rating >= 4).length;
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  // 4. DETAILED REVIEWS WRITTEN
  const detailedReviewsWritten = await Review.countDocuments({
    reviewer: userId,
    comment: { $exists: true, $ne: "" },
    $expr: { $gte: [{ $strLenCP: "$comment" }, 50] }, // komentarz >= 50 znaków
  });

  // 5. BOOKS ADDED
  const totalBooksAdded = await Book.countDocuments({
    owner: userId,
  });

  // 6. CONVERSATIONS STARTED
  const conversationsStarted = await Conversation.countDocuments({
    participants: userId,
  });

  // 7. LOGIN STREAK
  const loginStreakDoc = (await LoginStreak.findOne({
    user: userId,
  }).lean()) as ILoginStreak | null;
  const loginStreak = loginStreakDoc ? loginStreakDoc.currentStreak : 0;

  // === SPRAWDZANIE OSIĄGNIĘĆ ===

  for (const achievement of allAchievements) {
    // pomijanie jest brak requirement
    if (!achievement.requirement) continue;

    const existingUserAchievement = userAchievements.find(
      (ua) => ua.achievementId.toString() === achievement._id.toString()
    );

    if (existingUserAchievement?.unlockedAt) continue;

    let currentProgress = 0;
    let targetProgress = 0;
    let unlocked = false;

    // TRADING - Completed Transactions
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

    // COMMUNITY - Detailed Reviews
    if (achievement.requirement.detailedReviews) {
      targetProgress = achievement.requirement.detailedReviews;
      currentProgress = detailedReviewsWritten;
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
        avgRating >= achievement.requirement.averageRating;
    }

    // REPUTATION - Positive Reviews
    if (achievement.requirement.positiveReviews) {
      targetProgress = achievement.requirement.positiveReviews;
      currentProgress = positiveReviews;
      unlocked = currentProgress >= targetProgress;
    }

    // COLLECTION - Total Books Added
    if (achievement.requirement.totalBooksAdded) {
      targetProgress = achievement.requirement.totalBooksAdded;
      currentProgress = totalBooksAdded;
      unlocked = currentProgress >= targetProgress;
    }

    // SOCIAL - Conversations Started
    if (achievement.requirement.conversationsStarted) {
      targetProgress = achievement.requirement.conversationsStarted;
      currentProgress = conversationsStarted;
      unlocked = currentProgress >= targetProgress;
    }

    // LOYALTY - Login Streak
    if (achievement.requirement.loginStreak) {
      targetProgress = achievement.requirement.loginStreak;
      currentProgress = loginStreak;
      unlocked = currentProgress >= targetProgress;
    }

    // pomijanie jesli zaden requirement nie pasowal
    if (targetProgress === 0) continue;

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

          user.points += achievement.points;
          await user.save();
        }
      }
    } else {
      await UserAchievement.create({
        userId,
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

        user.points += achievement.points;
        await user.save();
      }
    }
  }

  return { newlyUnlocked, progressUpdates };
}
