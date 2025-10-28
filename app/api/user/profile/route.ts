import { NextResponse, NextRequest } from 'next/server';
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

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDB();

  const formData = await req.formData();

  const username = formData.get('username') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const location = formData.get('location') as string;
  const bio = formData.get('bio') as string;
  const avatarFile = formData.get('avatar');

  let profileImage = '';

  if (avatarFile instanceof File) {
    const buffer = await avatarFile.arrayBuffer();
    const base64 = `data:${avatarFile.type};base64,${Buffer.from(buffer).toString('base64')}`;
    profileImage = base64;
  } else if (typeof avatarFile === 'string') {
    profileImage = avatarFile;
  }

  await User.findOneAndUpdate(
    { email: session.user.email },
    { username, email, phone, location, bio, profileImage },
    { new: true }
  );

  return NextResponse.json({ message: 'Profile updated' });
}