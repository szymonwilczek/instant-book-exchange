import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  initiator: mongoose.Types.ObjectId; // uzytkownik inicjujacy (User ID)
  receiver: mongoose.Types.ObjectId; // uzytkownik odbierajacy (User ID)
  offeredBook: mongoose.Types.ObjectId; // ksiazka oferowana (Book ID)
  wishedBook?: mongoose.Types.ObjectId; // ksiazka z wishlisty (opcjonalne, Book ID)
  status: 'pending' | 'accepted' | 'completed'; // status transakcji
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema({
  initiator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  offeredBook: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  wishedBook: { type: Schema.Types.ObjectId, ref: 'Book' },
  status: { type: String, enum: ['pending', 'accepted', 'completed'], default: 'pending' },
}, { timestamps: true });

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
