import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  googleId?: string; // rejestracja przez Google
  wishlist: mongoose.Types.ObjectId[]; // array ID ksiazek z wishlisty
  offeredBooks: mongoose.Types.ObjectId[]; // array ID oferowanych ksiazek
  points: number; // punkty za transkacje
  averageRating: number; // srednia ocena z recenzji
  preferences?: {
    genres?: string[]; // opcjonalne preferencje (gatunki itd)
  };
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  googleId: { type: String, sparse: true }, // sparse dla opcjonalnego
  wishlist: [{ type: Schema.Types.ObjectId, ref: 'Book' }],
  offeredBooks: [{ type: Schema.Types.ObjectId, ref: 'Book' }],
  points: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  preferences: {
    genres: [{ type: String }],
  },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
