import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/lib/db/connect';
import Book from '@/lib/models/Book';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';

  await connectToDB();
  const books = await Book.find({
    status: 'available',
    $or: [
      { title: { $regex: q, $options: 'i' } },
      { author: { $regex: q, $options: 'i' } }
    ]
  }).populate('owner');

  const offers = books.map(book => ({
    offeredBook: book,
    owner: book.owner,
    matchType: 'search'
  }));

  return NextResponse.json(offers);
}
