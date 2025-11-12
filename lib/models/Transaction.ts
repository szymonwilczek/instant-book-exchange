import mongoose, { Document, Schema } from "mongoose";

export interface ITransaction extends Document {
  initiator: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  requestedBook: mongoose.Types.ObjectId;
  offeredBooks: mongoose.Types.ObjectId[];
  exchangeLocation: string;
  deliveryMethod: "personal" | "paczkomat" | "courier";
  status: "pending" | "accepted" | "rejected" | "completed";
  acceptedAt?: Date;
  rejectedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    initiator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requestedBook: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    offeredBooks: [{ type: Schema.Types.ObjectId, ref: "Book" }],
    exchangeLocation: { type: String, required: true },
    deliveryMethod: {
      type: String,
      enum: ["personal", "paczkomat", "courier"],
      default: "personal",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
      default: "pending",
    },
    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
