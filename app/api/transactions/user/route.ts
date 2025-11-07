import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Transaction from "@/lib/models/Transaction";
import User from "@/lib/models/User";
import Book from "@/lib/models/Book";
import BookSnapshot, { IBookSnapshot } from "@/lib/models/BookSnapshot";
import mongoose from "mongoose";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDB();

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

  // surowe transakcje
  const rawTransactions = await Transaction.find({
    $or: [{ initiator: user._id }, { receiver: user._id }],
  })
    .lean()
    .sort({ createdAt: -1 });

  const transactionsWithSnapshots = await Promise.all(
    rawTransactions.map(async (rawTransaction) => {
      // populate users
      const initiator = await User.findById(rawTransaction.initiator)
        .select("email username profileImage")
        .lean();
      const receiver = await User.findById(rawTransaction.receiver)
        .select("email username profileImage")
        .lean();

      // populate lub fallback requestedBook
      const requestedBook = await Book.findById(
        rawTransaction.requestedBook
      ).lean();

      // populate lub fallback offeredBooks
      const offeredBooks = await Promise.all(
        rawTransaction.offeredBooks.map(
          async (bookId: mongoose.Types.ObjectId) => {
            const book = await Book.findById(bookId).lean();
            if (!book) {
              const snapshot = (await BookSnapshot.findOne({
                originalBookId: bookId,
              }).lean()) as IBookSnapshot | null;

              if (snapshot) {
                return {
                  _id: snapshot.originalBookId,
                  title: snapshot.title,
                  author: snapshot.author,
                  imageUrl: snapshot.imageUrl,
                  condition: snapshot.condition,
                  ownerNote: snapshot.ownerNote,
                };
              }
            }

            return book;
          }
        )
      );

      // filtrowanie null/undefined
      const validOfferedBooks = offeredBooks.filter(Boolean);

      return {
        ...rawTransaction,
        initiator,
        receiver,
        requestedBook,
        offeredBooks: validOfferedBooks,
      };
    })
  );

  return NextResponse.json(transactionsWithSnapshots);
}
