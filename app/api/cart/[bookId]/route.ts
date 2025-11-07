import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Cart, { ICartItem } from "@/lib/models/Cart";
import User from "@/lib/models/User";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDB();

    const { bookId } = await params;

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

    const cart = await Cart.findOne({ user: user._id });
    if (!cart)
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });

    cart.items = cart.items.filter(
      (item: ICartItem) => item.book.toString() !== bookId
    );
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
    console.error("Error removing from cart:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
