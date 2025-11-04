import mongoose, { Document, Schema } from "mongoose";

export interface IUserAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  achievementId: mongoose.Types.ObjectId;
  progress: number;
  unlockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserAchievementSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    achievementId: {
      type: Schema.Types.ObjectId,
      ref: "Achievement",
      required: true,
    },
    progress: { type: Number, default: 0 },
    unlockedAt: { type: Date },
  },
  { timestamps: true }
);

// indeks dla szybkiego wyszukiwania
UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

export default mongoose.models.UserAchievement ||
  mongoose.model<IUserAchievement>("UserAchievement", UserAchievementSchema);
