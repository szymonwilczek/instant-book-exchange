import mongoose, { Document, Schema } from 'mongoose';

export interface IBook extends Document {
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  imageUrl?: string;
  owner: mongoose.Types.ObjectId; // ID wlasciciela (User)
  status: 'available' | 'exchanged'; // status ksiazki
  createdAt: Date;
}

const BookSchema: Schema = new Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String },
  description: { type: String },
  imageUrl: { type: String },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['available', 'exchanged'], default: 'available' },
}, { timestamps: true });

export default mongoose.models.Book || mongoose.model<IBook>('Book', BookSchema);
