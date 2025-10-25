import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/auth';
import connectToDB from '@/lib/db/connect';
import User from '@/lib/models/User';
import Book from '@/lib/models/Book';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, author, isbn, imageUrl } = await req.json();
  await connectToDB();

  const user = await User.findOne({ email: session.user.email });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const book = await Book.create({ title, author, isbn, imageUrl, owner: user._id });
  user.wishlist.push(book._id);
  await user.save();

  return NextResponse.json({ message: 'Added to wishlist' });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bookId } = await req.json();
  await connectToDB();

  const user = await User.findOne({ email: session.user.email });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  user.wishlist = user.wishlist.filter(id => id.toString() !== bookId);
  await user.save();
  await Book.findByIdAndDelete(bookId);

  return NextResponse.json({ message: 'Removed from wishlist' });
}
