import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Book from "@/lib/models/Book";
import User from "@/lib/models/User";
import PointsHistory from "@/lib/models/PointsHistory";

const PROMOTION_COST = 100;
const PROMOTION_DAYS = 30;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();

    const { bookId } = await req.json();
    console.log("Received bookId:", bookId, "Type:", typeof bookId);

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // czy user ma wystarczajaco punktow
    if (user.points < PROMOTION_COST) {
      return NextResponse.json(
        { error: "Insufficient points" },
        { status: 400 }
      );
    }

    // znajdowanie ksiazki
    const book = await Book.findById(bookId);
    console.log("Found book:", book);
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // czy user jest wlascicielem
    if (book.owner.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: "You can only promote your own books" },
        { status: 403 }
      );
    }

    // czy ksiazka nie jest juz promowana
    if (book.promotedUntil && new Date(book.promotedUntil) > new Date()) {
      return NextResponse.json(
        { error: "Book is already promoted" },
        { status: 400 }
      );
    }

    // promowanie ksiazki
    const promotedUntil = new Date();
    promotedUntil.setDate(promotedUntil.getDate() + PROMOTION_DAYS);

    book.promotedUntil = promotedUntil;
    book.promotedAt = new Date();
    await book.save();

    // odjecie punktow
    user.points -= PROMOTION_COST;
    await user.save();

    // zapisanie historii promowania
    await PointsHistory.create({
      user: user._id,
      amount: PROMOTION_COST,
      type: "spent",
      source: "book_promotion",
      description: `Promoted "${book.title}" for ${PROMOTION_DAYS} days`,
      relatedBook: book._id,
    });

    return NextResponse.json({
      message: "Book promoted successfully",
      promotedUntil,
      remainingPoints: user.points,
    });
  } catch (error) {
    console.error("Error promoting book:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
