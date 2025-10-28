import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Book from '@/lib/models/Book'
import { connect } from '@/lib/db/connect'
import { authOptions } from '@/app/api/auth/[...nextauth]/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connect()
    const body = await request.json()

    const book = new Book({
      title: body.title,
      author: body.author,
      description: body.description,
      imageUrl: body.image,
      owner: session.user.id,
      status: 'available',
    })

    const savedBook = await book.save()

    return NextResponse.json({
      id: savedBook._id.toString(),
      ...savedBook.toObject(),
    })
  } catch (error) {
    console.error('Error creating book:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}