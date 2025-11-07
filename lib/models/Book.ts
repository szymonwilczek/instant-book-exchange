import mongoose, { Document, Schema } from "mongoose";

export interface IBook extends Document {
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  imageUrl?: string;
  owner: mongoose.Types.ObjectId;
  status: "available" | "exchanged";
  condition: "new" | "used" | "damaged";
  genres: string[];
  viewCount: number;
  isActive: boolean;
  ownerNote?: string;
  promotedUntil?: Date;
  promotedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String },
    description: { type: String },
    imageUrl: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["available", "exchanged"],
      default: "available",
    },
    condition: {
      type: String,
      enum: ["new", "used", "damaged"],
      default: "used",
    },
    genres: [{ type: String }],
    viewCount: { type: Number, default: 0 },
    ownerNote: { type: String },
    isActive: { type: Boolean, default: true },
    promotedUntil: { type: Date },
    promotedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Book ||
  mongoose.model<IBook>("Book", BookSchema);
