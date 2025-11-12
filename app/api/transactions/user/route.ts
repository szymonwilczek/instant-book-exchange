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

  const rawTransactions = await Transaction.find({
    $or: [{ initiator: user._id }, { receiver: user._id }],
  })
    .lean()
    .sort({ updatedAt: -1 });

  const transactionsWithSnapshots = await Promise.all(
    rawTransactions.map(async (rawTransaction) => {
      const initiator = await User.findById(rawTransaction.initiator)
        .select("email username profileImage")
        .lean();
      const receiver = await User.findById(rawTransaction.receiver)
        .select("email username profileImage")
        .lean();

      let requestedBook = null;
      const requestedSnapshot = (await BookSnapshot.findOne({
        originalBookId: rawTransaction.requestedBook,
      }).lean()) as IBookSnapshot | null;

      if (requestedSnapshot) {
        requestedBook = {
          _id: requestedSnapshot.originalBookId,
          title: requestedSnapshot.title,
          author: requestedSnapshot.author,
          imageUrl: requestedSnapshot.imageUrl,
          condition: requestedSnapshot.condition,
          ownerNote: requestedSnapshot.ownerNote,
        };
      } else {
        requestedBook = await Book.findById(
          rawTransaction.requestedBook
        ).lean();
      }

      const offeredBooks = await Promise.all(
        rawTransaction.offeredBooks.map(
          async (bookId: mongoose.Types.ObjectId) => {
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

            return await Book.findById(bookId).lean();
          }
        )
      );

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
