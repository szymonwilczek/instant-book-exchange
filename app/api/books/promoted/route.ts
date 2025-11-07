import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db/connect";
import Book from "@/lib/models/Book";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const now = new Date();

    // wszystkie aktywne promowane ksiazki
    const skip = (page - 1) * limit;

    const promotedBooks = await Book.find({
      promotedUntil: { $gt: now },
      status: "available",
    })
      .sort({ promotedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("owner", "username email location profileImage");

    const total = await Book.countDocuments({
      promotedUntil: { $gt: now },
      status: "available",
    });

    return NextResponse.json({
      books: promotedBooks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching promoted books:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
