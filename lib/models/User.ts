import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  googleId?: string;
  password?: string;
  wishlist: mongoose.Types.ObjectId[];
  offeredBooks: mongoose.Types.ObjectId[];
  points: number;
  averageRating: number;
  preferences?: {
    genres?: string[];
  };
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  googleId: { type: String, sparse: true },
  password: { type: String },
  wishlist: [{ type: Schema.Types.ObjectId, ref: 'Book' }],
  offeredBooks: [{ type: Schema.Types.ObjectId, ref: 'Book' }],
  points: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  preferences: {
    genres: [{ type: String }],
  },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
