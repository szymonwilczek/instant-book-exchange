// /home/wolfie/Dokumenty/GitHub/bookstore/app/api/transactions/user/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Transaction from "@/lib/models/Transaction";
import User from "@/lib/models/User";
import Book from "@/lib/models/Book";
import BookSnapshot from "@/lib/models/BookSnapshot";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDB();

  const user = await User.findOne({ email: session.user.email });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  console.log("=== FETCHING TRANSACTIONS FOR USER:", user._id);

  // surowe transakcje
  const rawTransactions = await Transaction.find({
    $or: [{ initiator: user._id }, { receiver: user._id }],
  })
    .lean()
    .sort({ createdAt: -1 });

  console.log("=== RAW TRANSACTIONS COUNT:", rawTransactions.length);

  if (rawTransactions.length > 0) {
    console.log(
      "=== FIRST RAW TRANSACTION:",
      JSON.stringify(rawTransactions[0], null, 2)
    );
  }

  const transactionsWithSnapshots = await Promise.all(
    rawTransactions.map(async (rawTransaction) => {
      console.log(`\n=== PROCESSING TRANSACTION ${rawTransaction._id} ===`);

      // populate users
      const initiator = await User.findById(rawTransaction.initiator)
        .select("email username profileImage")
        .lean();
      const receiver = await User.findById(rawTransaction.receiver)
        .select("email username profileImage")
        .lean();

      console.log("Raw requestedBook ID:", rawTransaction.requestedBook);
      console.log("Raw offeredBooks IDs:", rawTransaction.offeredBooks);

      // populate lub fallback requestedBook
      let requestedBook = await Book.findById(
        rawTransaction.requestedBook
      ).lean();

      if (!requestedBook) {
        console.log("⚠️ RequestedBook not found, searching for snapshot...");
        const snapshot = await BookSnapshot.findOne({
          originalBookId: rawTransaction.requestedBook,
        }).lean();

        console.log("Snapshot found:", snapshot ? "YES" : "NO");
        if (snapshot) {
          console.log("Using snapshot:", snapshot.title);
          requestedBook = {
            _id: snapshot.originalBookId,
            title: snapshot.title,
            author: snapshot.author,
            imageUrl: snapshot.imageUrl,
            condition: snapshot.condition,
            ownerNote: snapshot.ownerNote,
          };
        }
      }

      // populate lub fallback offeredBooks
      const offeredBooks = await Promise.all(
        rawTransaction.offeredBooks.map(
          async (bookId: mongoose.Types.ObjectId) => {
            console.log(`  Checking offeredBook: ${bookId}`);

            const book = await Book.findById(bookId).lean();

            if (!book) {
              console.log(
                `  ⚠️ Book ${bookId} not found, searching for snapshot...`
              );
              const snapshot = await BookSnapshot.findOne({
                originalBookId: bookId,
              }).lean();

              console.log(`  Snapshot found:`, snapshot ? "YES" : "NO");
              if (snapshot) {
                console.log(`  Using snapshot:`, snapshot.title);
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

      console.log(`  Final offeredBooks count: ${validOfferedBooks.length}`);

      return {
        ...rawTransaction,
        initiator,
        receiver,
        requestedBook,
        offeredBooks: validOfferedBooks,
      };
    })
  );

  console.log(
    "\n=== RETURNING",
    transactionsWithSnapshots.length,
    "TRANSACTIONS ===\n"
  );

  return NextResponse.json(transactionsWithSnapshots);
}

//TODO: usunąć logowanie w produkcji
