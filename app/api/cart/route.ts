import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Cart, { ICartItem } from "@/lib/models/Cart";
import User from "@/lib/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();

    const userEmail = session.user?.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 401 }
      );
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let cart = await Cart.findOne({ user: user._id }).populate({
      path: "items.book",
      populate: {
        path: "owner",
        select: "username email location profileImage averageRating",
      },
    });

    if (!cart) {
      cart = await Cart.create({ user: user._id, items: [] });
    }

    return NextResponse.json({ cart });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookId } = await req.json();
    if (!bookId) {
      return NextResponse.json({ error: "Book ID required" }, { status: 400 });
    }

    await connectToDB();

    const userEmail = session.user?.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 401 }
      );
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // sprawdzenie czy ksiazka istnieje i jest dostepna
    const Book = (await import("@/lib/models/Book")).default;
    const book = await Book.findById(bookId).populate("owner");

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    if (book.status !== "available") {
      return NextResponse.json(
        { error: "Book not available" },
        { status: 400 }
      );
    }

    // sprawdzenie czy to nie wlasna ksiazka
    if (book.owner._id.toString() === user._id.toString()) {
      return NextResponse.json(
        { error: "Cannot add your own book to cart" },
        { status: 400 }
      );
    }

    let cart = await Cart.findOne({ user: user._id });

    if (!cart) {
      cart = await Cart.create({ user: user._id, items: [] });
    }

    // sprawdzenie czy ksiazka jest juz w koszyku
    const bookExists = cart.items.some(
      (item: ICartItem) => item.book.toString() === bookId
    );
    if (bookExists) {
      return NextResponse.json(
        { error: "Book already in cart" },
        { status: 400 }
      );
    }

    cart.items.push({ book: bookId, addedAt: new Date() });
    await cart.save();

    await cart.populate({
      path: "items.book",
      populate: {
        path: "owner",
        select: "username email location profileImage averageRating",
      },
    });

    return NextResponse.json({ cart });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
