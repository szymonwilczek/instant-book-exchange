import mongoose, { Document, Schema } from "mongoose";

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";
export type AchievementCategory =
  | "trading"
  | "reputation"
  | "collection"
  | "activity"
  | "community"
  | "special";

export interface AchievementRequirement {
  completedTransactions?: number;
  averageRating?: number;
  minReviews?: number;
  positiveReviews?: number;
  totalBooksAdded?: number;
  quickResponses?: number;
  maxResponseTime?: number;
  loginStreak?: number;
  joinedBefore?: string;
  freeGiveaways?: number;
  conversationsStarted?: number;
  detailedReviews?: number;
}

export interface IAchievement extends Document {
  id: string;
  seriesId: string;
  seriesName: string;
  name: string;
  description: string;
  icon: string;
  tier: AchievementTier;
  category: AchievementCategory;
  points: number;
  requirement: AchievementRequirement;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AchievementSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    seriesId: { type: String, required: true },
    seriesName: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    tier: {
      type: String,
      enum: ["bronze", "silver", "gold", "platinum"],
      required: true,
    },
    category: {
      type: String,
      enum: [
        "trading",
        "reputation",
        "collection",
        "activity",
        "community",
        "special",
      ],
      required: true,
    },
    points: { type: Number, required: true },
    requirement: {
      completedTransactions: { type: Number },
      averageRating: { type: Number },
      minReviews: { type: Number },
      positiveReviews: { type: Number },
      totalBooksAdded: { type: Number },
      quickResponses: { type: Number },
      maxResponseTime: { type: Number },
      loginStreak: { type: Number },
      joinedBefore: { type: String },
      freeGiveaways: { type: Number },
      conversationsStarted: { type: Number },
      detailedReviews: { type: Number },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Achievement ||
  mongoose.model<IAchievement>("Achievement", AchievementSchema);
