import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Transaction from "@/lib/models/Transaction";
import Book from "@/lib/models/Book";
import User from "@/lib/models/User";
import mongoose from "mongoose";

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
  save: () => Promise<void>;
  populate: (fields: string) => Promise<PopulatedTransaction>;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json();
  await connectToDB();

  const transaction = (await Transaction.findById(params.id).populate(
    "initiator receiver requestedBook offeredBooks"
  )) as PopulatedTransaction | null;

  if (!transaction) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // sprawdzenie uprawnien
  const isInitiator = transaction.initiator._id.equals(user._id);
  const isReceiver = transaction.receiver._id.equals(user._id);

  if (!isInitiator && !isReceiver) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // tylko receiver moze zaakceptowac lub odrzucic
  if ((status === "accepted" || status === "rejected") && !isReceiver) {
    return NextResponse.json(
      { error: "Only receiver can accept or reject" },
      { status: 403 }
    );
  }

  // tylko initiator lub receiver moze oznaczyc jako completed
  if (status === "completed" && !isInitiator && !isReceiver) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const oldStatus = transaction.status;
  transaction.status = status;
  await transaction.save();

  // zmiana statusu ksiazek
  if (status === "accepted" && oldStatus === "pending") {
    // oznaczenie requestedBook jako exchanged
    await Book.findByIdAndUpdate(transaction.requestedBook._id, {
      status: "exchanged",
    });

    // oznaczenie wszystkich offeredBooks jako exchanged
    if (transaction.offeredBooks && transaction.offeredBooks.length > 0) {
      await Book.updateMany(
        { _id: { $in: transaction.offeredBooks.map((b) => b._id) } },
        { status: "exchanged" }
      );
    }
  }

  // przywrocenie statusu jesli odrzucono
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

  // przyznanie punktow po zakonczeniu transakcji
  if (status === "completed" && oldStatus === "accepted") {
    transaction.initiator.points += 10;
    transaction.receiver.points += 10;
    await transaction.initiator.save();
    await transaction.receiver.save();
  }

  await transaction.populate("initiator receiver requestedBook offeredBooks");

  return NextResponse.json(transaction);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDB();
  const transaction = await Transaction.findById(params.id).populate(
    "requestedBook offeredBooks initiator receiver"
  );

  if (!transaction) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const transactionDoc = transaction as unknown as {
    initiator: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
  };

  if (
    !transactionDoc.initiator.equals(user._id) &&
    !transactionDoc.receiver.equals(user._id)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json(transaction);
}
