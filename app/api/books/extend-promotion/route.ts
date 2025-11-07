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

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.points < PROMOTION_COST) {
      return NextResponse.json(
        { error: "Insufficient points" },
        { status: 400 }
      );
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    if (book.owner.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: "You can only extend promotion for your own books" },
        { status: 403 }
      );
    }

    // przedluzenie od obecnej daty wygasniecia lub od teraz
    const baseDate =
      book.promotedUntil && new Date(book.promotedUntil) > new Date()
        ? new Date(book.promotedUntil)
        : new Date();

    const newPromotedUntil = new Date(baseDate);
    newPromotedUntil.setDate(newPromotedUntil.getDate() + PROMOTION_DAYS);

    book.promotedUntil = newPromotedUntil;
    await book.save();

    user.points -= PROMOTION_COST;
    await user.save();

    await PointsHistory.create({
      user: user._id,
      amount: PROMOTION_COST,
      type: "spent",
      source: "book_promotion",
      description: `Extended promotion for "${book.title}" for ${PROMOTION_DAYS} days`,
      relatedBook: book._id,
    });

    return NextResponse.json({
      message: "Promotion extended successfully",
      promotedUntil: newPromotedUntil,
      remainingPoints: user.points,
    });
  } catch (error) {
    console.error("Error extending promotion:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
