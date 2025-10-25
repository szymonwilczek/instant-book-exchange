import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/auth';
import connectToDB from '@/lib/db/connect';
import Transaction from '@/lib/models/Transaction';
import User from '@/lib/models/User';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { status } = await req.json();
  await connectToDB();

  const transaction = await Transaction.findById(params.id).populate('initiator receiver offeredBook wishedBook');
  if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

  // sprawdzanie uprawnien
  const user = await User.findOne({ email: session.user.email });
  if (!transaction.initiator._id.equals(user._id) && !transaction.receiver._id.equals(user._id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  transaction.status = status;
  await transaction.save();

  if (status === 'completed') {
    // dodawanie punktow
    transaction.initiator.points += 10;
    transaction.receiver.points += 1;
    await transaction.initiator.save();
    await transaction.receiver.save();
  }

  return NextResponse.json(transaction);
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDB();
  const transaction = await Transaction.findById(params.id).populate('offeredBook wishedBook initiator receiver');
  if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

  // sprawdzanie uprawnien
  const user = await User.findOne({ email: session.user.email });
  if (!transaction.initiator.equals(user._id) && !transaction.receiver.equals(user._id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  return NextResponse.json(transaction);
}
