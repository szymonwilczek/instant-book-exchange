import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Cart from "@/lib/models/Cart";
import Transaction from "@/lib/models/Transaction";
import Book from "@/lib/models/Book";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { exchanges } = await req.json();
    // exchanges: [{ requestedBookId, offeredBookIds: [], exchangeLocation }]

    if (!exchanges || !Array.isArray(exchanges) || exchanges.length === 0) {
      return NextResponse.json(
        { error: "Invalid exchanges data" },
        { status: 400 }
      );
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

    const createdTransactions = [];

    for (const exchange of exchanges) {
      const {
        requestedBookId,
        offeredBookIds = [],
        exchangeLocation,
      } = exchange;

      if (!requestedBookId || !exchangeLocation) {
        continue; // pomijanie nieprawidlowych danych
      }

      const requestedBook =
        await Book.findById(requestedBookId).populate("owner");
      if (!requestedBook || requestedBook.status !== "available") {
        continue;
      }

      const transaction = await Transaction.create({
        initiator: user._id,
        receiver: requestedBook.owner._id,
        requestedBook: requestedBookId,
        offeredBooks: offeredBookIds,
        exchangeLocation,
        status: "pending",
      });

      createdTransactions.push(transaction);
    }

    // czyszczenie koszyka
    await Cart.findOneAndUpdate({ user: user._id }, { $set: { items: [] } });

    return NextResponse.json({
      message: "Transactions created successfully",
      transactions: createdTransactions,
    });
  } catch (error) {
    console.error("Error during checkout:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
