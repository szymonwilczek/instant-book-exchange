import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  transactionId: mongoose.Types.ObjectId; // id transakcji
  reviewer: mongoose.Types.ObjectId; // uzytkownik oceniajacy (User ID)
  reviewedUser: mongoose.Types.ObjectId; // uzytkownik oceniany (User ID)
  rating: number; // ocena 1-5
  comment?: string; // (opcjonalny) komentarz
  createdAt: Date;
}

const ReviewSchema: Schema = new Schema({
  transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
  reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reviewedUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
}, { timestamps: true });

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
