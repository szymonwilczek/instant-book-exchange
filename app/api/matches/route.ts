import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/auth';
import { getMatchingOffers } from '@/lib/matching';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const matches = await getMatchingOffers(session.user.email!);
  return NextResponse.json(matches);
}
