import mongoose, { Document, Schema } from "mongoose";

interface NotificationData {
  // dla wiadomosci
  conversationId?: mongoose.Types.ObjectId;
  messagePreview?: string;
  sender?: {
    username: string;
    avatar?: string;
  };

  // dla transakcji
  transactionId?: mongoose.Types.ObjectId;
  transactionStatus?: "pending" | "accepted" | "rejected" | "completed";
  bookTitle?: string;

  // dla matchy (wishlista)
  bookId?: mongoose.Types.ObjectId;
  matchingBook?: {
    title: string;
    cover?: string;
  };
}

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: "message" | "transaction" | "match" | "review";
  read: boolean;
  data: NotificationData;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["message", "transaction", "match", "review"],
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    data: {
      conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
      messagePreview: String,
      sender: {
        username: String,
        avatar: String,
      },
      transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
      transactionStatus: {
        type: String,
        enum: ["pending", "accepted", "rejected", "completed"],
      },
      bookTitle: String,
      bookId: { type: Schema.Types.ObjectId, ref: "Book" },
      matchingBook: {
        title: String,
        cover: String,
      },
    },
  },
  { timestamps: true }
);

// indeks dla szybkiego pobierania nieprzeczytanych
NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
