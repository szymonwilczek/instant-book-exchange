import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/lib/db/connect';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  }

  await connectToDB();
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return NextResponse.json({ error: 'User already exists' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({ email, name, password: hashedPassword });

  return NextResponse.json({ message: 'User created', userId: user._id });
}
