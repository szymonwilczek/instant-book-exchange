import mongoose, { Document, Schema } from "mongoose";

export interface IBookSnapshot extends Document {
  originalBookId: mongoose.Types.ObjectId;
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  imageUrl?: string;
  condition: "new" | "used" | "damaged";
  ownerNote?: string;
  createdAt: Date;
}

const BookSnapshotSchema: Schema = new Schema(
  {
    originalBookId: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String },
    description: { type: String },
    imageUrl: { type: String },
    condition: {
      type: String,
      enum: ["new", "used", "damaged"],
      default: "used",
    },
    ownerNote: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.BookSnapshot ||
  mongoose.model<IBookSnapshot>("BookSnapshot", BookSnapshotSchema);
