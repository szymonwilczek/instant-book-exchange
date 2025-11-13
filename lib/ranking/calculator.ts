import connectToDB from "../db/connect";
import User, { IUser } from "../models/User";
import Transaction from "../models/Transaction";
import Review from "../models/Review";
import Book from "../models/Book";
import Conversation from "../models/Conversation";
import LoginStreak from "../models/LoginStreak";
import UserAchievement from "../models/UserAchievement";
import Achievement from "../models/Achievement";
import { ScoreBreakdown, RankingStats, TierType } from "../types/ranking";

interface CalculatedScore {
  totalScore: number;
  scores: ScoreBreakdown;
  stats: RankingStats;
}

/**
 * Oblicza Trading Score (30% wagi)
 * - Ukończone transakcje: 50 pkt/wymiana
 * - Pierwsza wymiana użytkownika: +100 pkt (mentoring bonus)
 * - Penalty: -50 pkt za odrzuconą transakcję (gdy druga strona coś oferowała)
 */
async function calculateTradingScore(
  userId: string,
): Promise<{ score: number; stats: Partial<RankingStats> }> {
  const completedTransactions = await Transaction.find({
    $or: [{ initiator: userId }, { receiver: userId }],
    status: "completed",
  }).lean();

  const rejectedTransactions = await Transaction.find({
    initiator: userId,
    status: "rejected",
  })
    .populate("offeredBooks")
    .lean();

  let score = 0;

  // podstawowe punkty za transakcje
  score += completedTransactions.length * 50;

  // penalty za odrzucone transakcje (tylko jesli druga strona cos oferowala)
  for (const tx of rejectedTransactions) {
    if (
      tx.offeredBooks &&
      Array.isArray(tx.offeredBooks) &&
      tx.offeredBooks.length > 0
    ) {
      score -= 50;
    }
  }

  // wynik nie moze byc ujemny
  score = Math.max(0, score);

  return {
    score,
    stats: {
      completedTransactions: completedTransactions.length,
    },
  };
}

/**
 * Oblicza Reputation Score (25% wagi)
 * - Średnia ocen: Rating × 200 (max 1000 pkt przy 5.0)
 * - Liczba pozytywnych opinii: 10 pkt/opinia
 * - Detailed reviews otrzymane: 25 pkt/opinia z >50 znakami
 */
async function calculateReputationScore(
  userId: string,
): Promise<{ score: number; stats: Partial<RankingStats> }> {
  const reviews = await Review.find({ reviewedUser: userId }).lean();

  let score = 0;
  let totalRating = 0;
  let positiveReviews = 0;
  let detailedReviews = 0;

  for (const review of reviews) {
    totalRating += review.rating;

    if (review.rating >= 4) {
      positiveReviews++;
      score += 10;
    }

    if (review.comment && review.comment.length >= 50) {
      detailedReviews++;
      score += 25;
    }
  }

  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
  score += averageRating * 200;

  return {
    score,
    stats: {
      averageRating,
      totalReviews: reviews.length,
      positiveReviews,
      detailedReviewsReceived: detailedReviews,
    },
  };
}

/**
 * Oblicza Community Score (20% wagi)
 * - Rozpoczęte konwersacje: 5 pkt/konwersacja
 * - Responsiveness: +50 pkt za średni czas odpowiedzi <24h
 * - Free giveaways: 75 pkt/darmowa wymiana
 * - Detailed reviews wystawione: 15 pkt/opinia z >50 znakami
 */
async function calculateCommunityScore(
  userId: string,
): Promise<{ score: number; stats: Partial<RankingStats> }> {
  const conversations = await Conversation.find({
    participants: userId,
  })
    .populate("messages")
    .lean();

  const givenReviews = await Review.find({ reviewer: userId }).lean();

  const freeGiveaways = await Transaction.find({
    initiator: userId,
    status: "completed",
    $or: [{ offeredBooks: { $size: 0 } }, { offeredBooks: { $exists: false } }],
  }).lean();

  let score = 0;

  score += conversations.length * 5;

  // sredni czas odpowiedzi
  let totalResponseTime = 0;
  let responseCount = 0;

  interface Message {
    sender?: { toString: () => string } | string;
    timestamp: Date | string;
  }

  for (const conv of conversations) {
    const messages = ((conv as unknown as { messages?: Message[] }).messages ||
      []) as Message[];

    for (let i = 1; i < messages.length; i++) {
      const currentSender = messages[i].sender?.toString() ?? "";
      const previousSender = messages[i - 1].sender?.toString() ?? "";

      if (currentSender === userId && previousSender !== userId) {
        const responseTime =
          new Date(messages[i].timestamp).getTime() -
          new Date(messages[i - 1].timestamp).getTime();
        totalResponseTime += responseTime;
        responseCount++;
      }
    }
  }

  const avgResponseTimeHours =
    responseCount > 0
      ? totalResponseTime / responseCount / (1000 * 60 * 60)
      : 0;

  if (avgResponseTimeHours < 24 && responseCount > 0) {
    score += 50;
  }

  score += freeGiveaways.length * 75;

  const detailedReviewsGiven = givenReviews.filter(
    (r) => r.comment && r.comment.length >= 50,
  ).length;
  score += detailedReviewsGiven * 15;

  return {
    score,
    stats: {
      conversationsStarted: conversations.length,
      responseTimeAvg: avgResponseTimeHours,
      freeGiveaways: freeGiveaways.length,
      detailedReviewsGiven,
    },
  };
}

/**
 * Oblicza Activity Score (15% wagi)
 * - Login streak: 2 pkt/dzień (max 730 pkt za rok)
 * - Książki dodane: 10 pkt/książka
 * - Wishlist aktywność: 5 pkt za aktualizację listy życzeń
 * - Profile completeness: 100 pkt za wypełniony profil
 */
async function calculateActivityScore(
  userId: string,
): Promise<{ score: number; stats: Partial<RankingStats> }> {
  const user = (await User.findById(userId).lean()) as IUser | null;
  const loginStreak = await LoginStreak.findOne({ user: userId }).lean();
  const booksAdded = await Book.countDocuments({ owner: userId });

  let score = 0;

  // login streak
  const streakDays =
    (loginStreak as { currentStreak?: number } | null)?.currentStreak ?? 0;
  score += Math.min(streakDays * 2, 730);

  // dodane ksiazki
  score += booksAdded * 10;

  // aktywnosc wishlist
  const wishlistCount = user?.wishlist ? user.wishlist.length : 0;
  score += wishlistCount * 5;

  // kompletnosc profilu
  const profileComplete = !!(
    user?.bio &&
    user?.location &&
    user?.profileImage &&
    user?.username
  );

  if (profileComplete) {
    score += 100;
  }

  return {
    score,
    stats: {
      loginStreakDays: streakDays,
      booksAdded,
      wishlistUpdates: wishlistCount,
      profileCompleteness: profileComplete,
    },
  };
}

/**
 * Oblicza Quality Score (10% wagi)
 * - Osiągnięcia: Punkty z osiągnięć × 0.5
 * - Completion rate: (Completed / Total Offers) × 300 pkt
 */
async function calculateQualityScore(
  userId: string,
): Promise<{ score: number; stats: Partial<RankingStats> }> {
  const userAchievements = await UserAchievement.find({
    userId,
    unlockedAt: { $exists: true },
  })
    .populate("achievementId")
    .lean();

  const totalTransactions = await Transaction.countDocuments({
    initiator: userId,
  });

  const completedTransactions = await Transaction.countDocuments({
    initiator: userId,
    status: "completed",
  });

  let score = 0;

  let achievementPoints = 0;
  for (const ua of userAchievements) {
    const achievement = ua.achievementId as unknown as { points?: number };
    if (achievement?.points) {
      achievementPoints += achievement.points;
    }
  }
  score += achievementPoints * 0.5;

  const completionRate =
    totalTransactions > 0 ? completedTransactions / totalTransactions : 0;
  score += completionRate * 300;

  return {
    score,
    stats: {
      achievementPoints,
      completionRate,
    },
  };
}

/**
 * Główna funkcja obliczająca całkowity score użytkownika
 */
export async function calculateUserScore(
  userId: string,
): Promise<CalculatedScore> {
  await connectToDB();

  const trading = await calculateTradingScore(userId);
  const reputation = await calculateReputationScore(userId);
  const community = await calculateCommunityScore(userId);
  const activity = await calculateActivityScore(userId);
  const quality = await calculateQualityScore(userId);

  // wagi: Trading 30%, Reputation 25%, Community 20%, Activity 15%, Quality 10%
  const scores: ScoreBreakdown = {
    trading: Math.round(trading.score * 0.3),
    reputation: Math.round(reputation.score * 0.25),
    community: Math.round(community.score * 0.2),
    activity: Math.round(activity.score * 0.15),
    quality: Math.round(quality.score * 0.1),
  };

  const totalScore = Math.round(
    scores.trading +
      scores.reputation +
      scores.community +
      scores.activity +
      scores.quality,
  );

  const stats: RankingStats = {
    completedTransactions: trading.stats.completedTransactions || 0,
    averageRating: reputation.stats.averageRating || 0,
    totalReviews: reputation.stats.totalReviews || 0,
    positiveReviews: reputation.stats.positiveReviews || 0,
    detailedReviewsReceived: reputation.stats.detailedReviewsReceived || 0,
    conversationsStarted: community.stats.conversationsStarted || 0,
    responseTimeAvg: community.stats.responseTimeAvg || 0,
    freeGiveaways: community.stats.freeGiveaways || 0,
    detailedReviewsGiven: community.stats.detailedReviewsGiven || 0,
    loginStreakDays: activity.stats.loginStreakDays || 0,
    booksAdded: activity.stats.booksAdded || 0,
    wishlistUpdates: activity.stats.wishlistUpdates || 0,
    profileCompleteness: activity.stats.profileCompleteness || false,
    achievementPoints: quality.stats.achievementPoints || 0,
    completionRate: quality.stats.completionRate || 0,
  };

  return {
    totalScore,
    scores,
    stats,
  };
}

/**
 * Przypisuje tier na podstawie totalScore
 */
export function assignTier(totalScore: number): TierType {
  if (totalScore >= 10000) return "legendary";
  if (totalScore >= 7500) return "diamond";
  if (totalScore >= 5000) return "platinum";
  if (totalScore >= 2500) return "gold";
  if (totalScore >= 1000) return "silver";
  return "bronze";
}

/**
 * Zwraca progi dla wszystkich tierów
 */
export function getTierThresholds(): Array<{
  tier: TierType;
  minScore: number;
  maxScore: number;
}> {
  return [
    { tier: "bronze", minScore: 0, maxScore: 999 },
    { tier: "silver", minScore: 1000, maxScore: 2499 },
    { tier: "gold", minScore: 2500, maxScore: 4999 },
    { tier: "platinum", minScore: 5000, maxScore: 7499 },
    { tier: "diamond", minScore: 7500, maxScore: 9999 },
    { tier: "legendary", minScore: 10000, maxScore: Infinity },
  ];
}
