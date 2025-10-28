import { NextRequest, NextResponse } from 'next/server'
import Book from '@/lib/models/Book'
import connectToDB from '@/lib/db/connect'

export async function GET(request: NextRequest) {
  try {
    await connectToDB()
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''

    const books = await Book.find({
      title: { $regex: q, $options: 'i' },
      status: 'available',
    }).limit(10)

    return NextResponse.json(books.map(book => ({
      id: book._id.toString(),
      title: book.title,
      author: book.author,
      description: book.description,
      image: book.imageUrl,
      isbn: book.isbn,
      source: 'local',
    })))
  } catch (error) {
    console.error('Error searching books:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}