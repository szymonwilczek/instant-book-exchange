import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/auth';
import connectToDB from '@/lib/db/connect';
import User from '@/lib/models/User';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDB();
  const user = await User.findOne({ email: session.user.email }).populate('wishlist offeredBooks');
  return NextResponse.json(user);
}
