import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import User from "@/lib/models/User";
import Book from "@/lib/models/Book";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // wszystkie promowane ksiazki uzytkownika
    const promotedBooks = await Book.find({
      owner: user._id,
      promotedUntil: { $exists: true, $ne: null },
    }).sort({ promotedAt: -1 });

    // podzialka na aktywne i wygasle
    const now = new Date();
    const active = promotedBooks.filter(
      (book) => book.promotedUntil && new Date(book.promotedUntil) > now
    );
    const expired = promotedBooks.filter(
      (book) => book.promotedUntil && new Date(book.promotedUntil) <= now
    );

    return NextResponse.json({
      active,
      expired,
      total: promotedBooks.length,
    });
  } catch (error) {
    console.error("Error fetching promoted books:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
