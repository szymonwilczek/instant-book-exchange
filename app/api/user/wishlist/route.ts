import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import User from "@/lib/models/User";
import Book from "@/lib/models/Book";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { bookId, title, author, isbn, imageUrl, description, genres } = body;

  await connectToDB();

  const userEmail = session.user?.email;
  if (!userEmail) {
    return NextResponse.json(
      { error: "User email not found" },
      { status: 401 }
    );
  }

  const user = await User.findOne({ email: userEmail });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  let book;

  // przypadek 1: dodawanie istniejacej ksiazki przez bookId
  if (bookId) {
    book = await Book.findById(bookId);
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // sprawdzenie czy jest juz na wishliscie
    if (
      user.wishlist.some(
        (id: mongoose.Types.ObjectId) => id.toString() === bookId
      )
    ) {
      return NextResponse.json(
        { error: "Book already in wishlist" },
        { status: 400 }
      );
    }

    user.wishlist.push(book._id);
    await user.save();

    return NextResponse.json({ message: "Added to wishlist", book });
  }

  // przypadek 2: tworzenie nowej ksiazki dla wishlisty
  if (!title || !author) {
    return NextResponse.json(
      { error: "Title and author are required" },
      { status: 400 }
    );
  }

  book = await Book.create({
    title,
    author,
    isbn,
    imageUrl,
    description,
    owner: user._id,
    status: "available",
    condition: "used",
    genres: genres || [],
    viewCount: 0,
  });

  user.wishlist.push(book._id);
  await user.save();

  return NextResponse.json({ message: "Added to wishlist", book });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await req.json();
  await connectToDB();

  const userEmail = session.user?.email;
  if (!userEmail) {
    return NextResponse.json(
      { error: "User email not found" },
      { status: 401 }
    );
  }

  const user = await User.findOne({ email: userEmail });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  user.wishlist = user.wishlist.filter(
    (id: mongoose.Types.ObjectId) => id.toString() !== bookId
  );
  await user.save();

  return NextResponse.json({ message: "Removed from wishlist" });
}
