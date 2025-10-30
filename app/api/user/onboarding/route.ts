import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/auth';
import connectToDB from '@/lib/db/connect';
import User from '@/lib/models/User';
import Book from '@/lib/models/Book';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { genres, books } = await req.json();
  await connectToDB();

  const user = await User.findOne({ email: session.user.email });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  user.preferences = { genres };

  for (const bookData of books) {
    const book = await Book.create({
      title: bookData.title,
      author: bookData.author,
      isbn: bookData.isbn,
      imageUrl: bookData.image,
      owner: user._id,
    });
    user.wishlist.push(book._id);
  }

  user.hasCompletedOnboarding = true;
  await user.save();

  return NextResponse.json({ message: 'Onboarding completed' });
}