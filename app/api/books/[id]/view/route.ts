import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db/connect";
import Book from "@/lib/models/Book";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDB();

    const book = await Book.findById(params.id);
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    book.viewCount += 1;
    await book.save();

    return NextResponse.json({ viewCount: book.viewCount });
  } catch (error) {
    console.error("Error incrementing view count:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
