import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/lib/db/connect';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { email, password, username } = await req.json();

  if (!email || !password || !username) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  }

  await connectToDB();
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return NextResponse.json({ error: 'User already exists' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({ email, username, password: hashedPassword, profileImage: 'https://i.imgur.com/4vb5jWt.png' });

  return NextResponse.json({ message: 'User created', userId: user._id });
}