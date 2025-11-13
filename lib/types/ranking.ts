import { IUserRanking } from "../models/UserRanking";

export type TierType =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "legendary";

export interface ScoreBreakdown {
  trading: number;
  reputation: number;
  community: number;
  activity: number;
  quality: number;
}

export interface RankingStats {
  completedTransactions: number;
  averageRating: number;
  totalReviews: number;
  positiveReviews: number;
  detailedReviewsReceived: number;
  conversationsStarted: number;
  responseTimeAvg: number;
  freeGiveaways: number;
  detailedReviewsGiven: number;
  loginStreakDays: number;
  booksAdded: number;
  wishlistUpdates: number;
  profileCompleteness: boolean;
  achievementPoints: number;
  completionRate: number;
}

export interface UserRankingData {
  userId: string;
  totalScore: number;
  scores: ScoreBreakdown;
  rank: number;
  tier: TierType;
  previousRank: number;
  stats: RankingStats;
  weeklyExchanges: number;
  weeklyReviews: number;
  lastActivity: Date;
  lastCalculated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RankingComparison {
  user1: UserRankingData;
  user2: UserRankingData;
  differences: {
    scoreDiff: number;
    rankDiff: number;
    scoreBreakdown: {
      trading: number;
      reputation: number;
      community: number;
      activity: number;
      quality: number;
    };
  };
}

export interface LeaderboardEntry extends UserRankingData {
  username: string;
  email: string;
  profileImage?: string;
}

export interface LeaderboardResponse {
  users: LeaderboardEntry[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export interface TierThreshold {
  tier: TierType;
  minScore: number;
  maxScore: number;
}
