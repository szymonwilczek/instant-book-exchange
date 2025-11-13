import mongoose, { Document, Schema } from "mongoose";

export interface IUserRanking extends Document {
  userId: mongoose.Types.ObjectId;

  totalScore: number;
  scores: {
    trading: number;
    reputation: number;
    community: number;
    activity: number;
    quality: number;
  };

  rank: number;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond" | "legendary";
  previousRank: number;

  stats: {
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
  };

  // anti-gaming
  weeklyExchanges: number;
  weeklyReviews: number;
  lastActivity: Date;

  // metadata
  lastCalculated: Date;
  createdAt: Date;
  updatedAt: Date;
}

function arrayLimit(val: mongoose.Types.ObjectId[]) {
  return val.length <= 3;
}

const UserRankingSchema = new Schema<IUserRanking>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    totalScore: {
      type: Number,
      default: 0,
      index: true,
    },
    scores: {
      trading: { type: Number, default: 0 },
      reputation: { type: Number, default: 0 },
      community: { type: Number, default: 0 },
      activity: { type: Number, default: 0 },
      quality: { type: Number, default: 0 },
    },
    rank: {
      type: Number,
      default: 0,
      index: true,
    },
    tier: {
      type: String,
      enum: ["bronze", "silver", "gold", "platinum", "diamond", "legendary"],
      default: "bronze",
      index: true,
    },
    previousRank: {
      type: Number,
      default: 0,
    },
    stats: {
      completedTransactions: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      positiveReviews: { type: Number, default: 0 },
      detailedReviewsReceived: { type: Number, default: 0 },
      conversationsStarted: { type: Number, default: 0 },
      responseTimeAvg: { type: Number, default: 0 },
      freeGiveaways: { type: Number, default: 0 },
      detailedReviewsGiven: { type: Number, default: 0 },
      loginStreakDays: { type: Number, default: 0 },
      booksAdded: { type: Number, default: 0 },
      wishlistUpdates: { type: Number, default: 0 },
      profileCompleteness: { type: Boolean, default: false },
      achievementPoints: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0, min: 0, max: 1 },
    },
    weeklyExchanges: {
      type: Number,
      default: 0,
    },
    weeklyReviews: {
      type: Number,
      default: 0,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastCalculated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

UserRankingSchema.index({ tier: 1, totalScore: -1 });
UserRankingSchema.index({ rank: 1, userId: 1 });

export default mongoose.models.UserRanking ||
  mongoose.model<IUserRanking>("UserRanking", UserRankingSchema);
