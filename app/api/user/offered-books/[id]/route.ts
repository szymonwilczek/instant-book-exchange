import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Book from "@/lib/models/Book";
import User from "@/lib/models/User";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectToDB();

    const { id } = await params;
    const { status, condition, ownerNote } = await req.json();

    const book = await Book.findById(id);
    if (!book)
      return NextResponse.json({ error: "Book not found" }, { status: 404 });

    console.log("Session user:", session.user);
    console.log("Book owner:", book.owner.toString());

    // ownership
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

    if (book.owner.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (status !== undefined) {
      book.isActive = status === "active";
    }
    if (condition !== undefined) {
      book.condition = condition;
    }
    if (ownerNote !== undefined) {
      book.ownerNote = ownerNote;
    }

    await book.save();

    return NextResponse.json({ message: "Book updated", book });
  } catch (error) {
    console.error("Error updating book:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
