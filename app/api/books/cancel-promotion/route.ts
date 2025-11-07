import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Book from "@/lib/models/Book";
import User from "@/lib/models/User";
import PointsHistory from "@/lib/models/PointsHistory";

const PROMOTION_COST = 100;

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

    const book = await Book.findById(bookId);
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    if (book.owner.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: "You can only cancel promotion for your own books" },
        { status: 403 }
      );
    }

    if (!book.promotedAt) {
      return NextResponse.json(
        { error: "Book is not promoted" },
        { status: 400 }
      );
    }

    // czy promocja zostala utworzona tego samego dnia
    const promotedDate = new Date(book.promotedAt);
    const today = new Date();
    const isSameDay =
      promotedDate.getDate() === today.getDate() &&
      promotedDate.getMonth() === today.getMonth() &&
      promotedDate.getFullYear() === today.getFullYear();

    if (!isSameDay) {
      return NextResponse.json(
        { error: "Can only cancel promotion on the same day it was created" },
        { status: 400 }
      );
    }

    // anulowanie promocji
    book.promotedUntil = undefined;
    book.promotedAt = undefined;
    await book.save();

    // zwracanie punktow
    user.points += PROMOTION_COST;
    await user.save();

    // zapisanie historii zwrotu
    await PointsHistory.create({
      user: user._id,
      amount: PROMOTION_COST,
      type: "earned",
      source: "promotion_refund",
      description: `Refund for cancelled promotion of "${book.title}"`,
      relatedBook: book._id,
    });

    return NextResponse.json({
      message: "Promotion cancelled successfully",
      refundedPoints: PROMOTION_COST,
      remainingPoints: user.points,
    });
  } catch (error) {
    console.error("Error cancelling promotion:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
