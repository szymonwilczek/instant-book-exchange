import { NextRequest, NextResponse } from 'next/server'

interface GoogleBookItem {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
    };
    industryIdentifiers?: {
      type: string;
      identifier: string;
    }[];
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Books API key not configured' }, { status: 500 })
    }

    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&key=${apiKey}&maxResults=10`)
    const data = await response.json()

    const books = data.items?.map((item: GoogleBookItem) => ({
      id: item.id,
      title: item.volumeInfo.title,
      author: item.volumeInfo.authors?.join(', '),
      description: item.volumeInfo.description,
      image: item.volumeInfo.imageLinks?.thumbnail,
      isbn: item.volumeInfo.industryIdentifiers?.find((id: { type: string; identifier: string }) => id.type === 'ISBN_13')?.identifier,
      source: 'google',
    })) || []

    return NextResponse.json(books)
  } catch (error) {
    console.error('Error searching Google Books:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}