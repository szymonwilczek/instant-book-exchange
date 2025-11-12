import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Transaction, { ITransaction } from "@/lib/models/Transaction";
import Book from "@/lib/models/Book";
import BookSnapshot, { IBookSnapshot } from "@/lib/models/BookSnapshot";
import User from "@/lib/models/User";
import mongoose from "mongoose";
import { checkAchievements } from "@/lib/achievements/checker";

interface PopulatedTransaction {
  _id: mongoose.Types.ObjectId;
  initiator: {
    _id: mongoose.Types.ObjectId;
    points: number;
    save: () => Promise<void>;
  };
  receiver: {
    _id: mongoose.Types.ObjectId;
    points: number;
    save: () => Promise<void>;
  };
  requestedBook: {
    _id: mongoose.Types.ObjectId;
  };
  offeredBooks: Array<{
    _id: mongoose.Types.ObjectId;
  }>;
  status: string;
  acceptedAt?: Date;
  rejectedAt?: Date;
  completedAt?: Date;
  save: () => Promise<void>;
  populate: (fields: string) => Promise<PopulatedTransaction>;
}

interface BookDocument {
  _id: mongoose.Types.ObjectId;
  title: string;
  author: string;
  imageUrl?: string;
  condition?: string;
  ownerNote?: string;
}

interface UserWishlistData {
  wishlist: mongoose.Types.ObjectId[];
  offeredBooks: mongoose.Types.ObjectId[];
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json();
  await connectToDB();

  const { id } = await params;

  const transaction = (await Transaction.findById(id).populate(
    "initiator receiver requestedBook offeredBooks"
  )) as PopulatedTransaction | null;

  if (!transaction) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

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

  const isInitiator = transaction.initiator._id.equals(user._id);
  const isReceiver = transaction.receiver._id.equals(user._id);

  if (!isInitiator && !isReceiver) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if ((status === "accepted" || status === "rejected") && !isReceiver) {
    return NextResponse.json(
      { error: "Only receiver can accept or reject" },
      { status: 403 }
    );
  }

  if (status === "completed" && !isInitiator && !isReceiver) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const oldStatus = transaction.status;
  transaction.status = status;

  const now = new Date();
  if (status === "accepted" && oldStatus === "pending") {
    transaction.acceptedAt = now;
  } else if (status === "rejected" && oldStatus === "pending") {
    transaction.rejectedAt = now;
  } else if (status === "completed" && oldStatus === "accepted") {
    transaction.completedAt = now;
  }

  // snapshoty i czyszczenie
  if (status === "completed" && oldStatus === "accepted") {
    const rawTransaction = (await Transaction.findById(
      id
    ).lean()) as ITransaction;

    if (!rawTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const initiatorBefore = (await User.findById(transaction.initiator._id)
      .select("wishlist offeredBooks")
      .lean()) as UserWishlistData | null;
    const receiverBefore = (await User.findById(transaction.receiver._id)
      .select("wishlist offeredBooks")
      .lean()) as UserWishlistData | null;

    // snapshot dla requestedBook
    const requestedBookSnapshot = await BookSnapshot.findOne({
      originalBookId: rawTransaction.requestedBook,
    });

    if (!requestedBookSnapshot) {
      const requestedBook = await Book.findById(rawTransaction.requestedBook);
      if (requestedBook) {
        await BookSnapshot.create({
          originalBookId: requestedBook._id,
          title: requestedBook.title,
          author: requestedBook.author,
          isbn: requestedBook.isbn,
          description: requestedBook.description,
          imageUrl: requestedBook.imageUrl,
          condition: requestedBook.condition,
          ownerNote: requestedBook.ownerNote,
        });
      }
    }

    // snapshoty dla offeredBooks
    for (const bookId of rawTransaction.offeredBooks) {
      const existingSnapshot = await BookSnapshot.findOne({
        originalBookId: bookId,
      });

      if (!existingSnapshot) {
        const offeredBook = await Book.findById(bookId);
        if (offeredBook) {
          await BookSnapshot.create({
            originalBookId: offeredBook._id,
            title: offeredBook.title,
            author: offeredBook.author,
            isbn: offeredBook.isbn,
            description: offeredBook.description,
            imageUrl: offeredBook.imageUrl,
            condition: offeredBook.condition,
            ownerNote: offeredBook.ownerNote,
          });
        }
      }
    }

    const requestedBookData = (await Book.findById(rawTransaction.requestedBook)
      .select("title")
      .lean()) as { title: string } | null;

    // usuwanie z offeredBooks receivera (ID)
    await User.findByIdAndUpdate(transaction.receiver._id, {
      $pull: { offeredBooks: rawTransaction.requestedBook },
    });

    // usuwanie z wishlist initiatora (po tytule, bo moze byc inne id)
    if (requestedBookData?.title) {
      const initiatorWishlistBooks = await Book.find({
        _id: { $in: initiatorBefore?.wishlist || [] },
        title: requestedBookData.title,
      })
        .select("_id")
        .lean();

      if (initiatorWishlistBooks.length > 0) {
        await User.findByIdAndUpdate(transaction.initiator._id, {
          $pull: {
            wishlist: { $in: initiatorWishlistBooks.map((b) => b._id) },
          },
        });
      }
    }

    await Book.findByIdAndDelete(rawTransaction.requestedBook);

    // offeredBooks: ksiazki ktore OFERUJE INITIATOR
    if (rawTransaction.offeredBooks.length > 0) {
      const offeredBooksData = await Book.find({
        _id: { $in: rawTransaction.offeredBooks },
      })
        .select("title")
        .lean();

      // usuwanie z offeredBooks initiatora (ID)
      await User.findByIdAndUpdate(transaction.initiator._id, {
        $pull: { offeredBooks: { $in: rawTransaction.offeredBooks } },
      });

      // usuwanie z wishlist receivera (po tytule, bo moga byc inne ID!)
      if (offeredBooksData.length > 0) {
        const titles = offeredBooksData.map((b) => b.title);
        const receiverWishlistBooks = await Book.find({
          _id: { $in: receiverBefore?.wishlist || [] },
          title: { $in: titles },
        })
          .select("_id")
          .lean();

        if (receiverWishlistBooks.length > 0) {
          await User.findByIdAndUpdate(transaction.receiver._id, {
            $pull: {
              wishlist: { $in: receiverWishlistBooks.map((b) => b._id) },
            },
          });
        }
      }

      await Book.deleteMany({
        _id: { $in: rawTransaction.offeredBooks },
      });
    }

    transaction.initiator.points += 10;
    transaction.receiver.points += 10;
    await transaction.initiator.save();
    await transaction.receiver.save();

    await checkAchievements(transaction.initiator._id.toString());
    await checkAchievements(transaction.receiver._id.toString());
  }

  await transaction.save();

  if (status === "rejected" && oldStatus === "pending") {
    await Book.findByIdAndUpdate(transaction.requestedBook._id, {
      status: "available",
    });

    if (transaction.offeredBooks && transaction.offeredBooks.length > 0) {
      await Book.updateMany(
        { _id: { $in: transaction.offeredBooks.map((b) => b._id) } },
        { status: "available" }
      );
    }
  }

  await transaction.populate("initiator receiver requestedBook offeredBooks");

  return NextResponse.json(transaction);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDB();

  const { id } = await params;

  const rawTransaction = (await Transaction.findById(
    id
  ).lean()) as ITransaction;

  if (!rawTransaction) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

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

  if (
    !rawTransaction.initiator.equals(user._id) &&
    !rawTransaction.receiver.equals(user._id)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const initiator = await User.findById(rawTransaction.initiator)
    .select("email username profileImage")
    .lean();
  const receiver = await User.findById(rawTransaction.receiver)
    .select("email username profileImage")
    .lean();

  let requestedBook: BookDocument | null = null;
  const requestedSnapshot = (await BookSnapshot.findOne({
    originalBookId: rawTransaction.requestedBook,
  }).lean()) as IBookSnapshot | null;

  if (requestedSnapshot) {
    requestedBook = {
      _id: requestedSnapshot.originalBookId as mongoose.Types.ObjectId,
      title: requestedSnapshot.title,
      author: requestedSnapshot.author,
      imageUrl: requestedSnapshot.imageUrl,
      condition: requestedSnapshot.condition,
      ownerNote: requestedSnapshot.ownerNote,
    };
  } else {
    requestedBook = await Book.findById(rawTransaction.requestedBook).lean();
  }

  const offeredBooks = await Promise.all(
    rawTransaction.offeredBooks.map(async (bookId: mongoose.Types.ObjectId) => {
      const snapshot = (await BookSnapshot.findOne({
        originalBookId: bookId,
      }).lean()) as IBookSnapshot | null;

      if (snapshot) {
        return {
          _id: snapshot.originalBookId as mongoose.Types.ObjectId,
          title: snapshot.title,
          author: snapshot.author,
          imageUrl: snapshot.imageUrl,
          condition: snapshot.condition,
          ownerNote: snapshot.ownerNote,
        };
      }

      return await Book.findById(bookId).lean();
    })
  );

  const validOfferedBooks = offeredBooks.filter(Boolean);

  return NextResponse.json({
    ...rawTransaction,
    initiator,
    receiver,
    requestedBook,
    offeredBooks: validOfferedBooks,
  });
}
