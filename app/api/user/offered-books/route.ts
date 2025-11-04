import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import User from "@/lib/models/User";
import Book from "@/lib/models/Book";
import Transaction from "@/lib/models/Transaction";
import Conversation from "@/lib/models/Conversation";
import Message from "@/lib/models/Message";
import BookSnapshot from "@/lib/models/BookSnapshot";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, author, isbn, imageUrl, description, condition, ownerNote } =
    await req.json();
  await connectToDB();

  const user = await User.findOne({ email: session.user.email });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const book = await Book.create({
    title,
    author,
    isbn,
    imageUrl,
    description,
    owner: user._id,
    condition: condition || "used",
    ownerNote,
  });
  user.offeredBooks.push(book._id);
  await user.save();

  return NextResponse.json({ message: "Added to offered books" });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await req.json();
  await connectToDB();

  const user = await User.findOne({ email: session.user.email });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const book = await Book.findById(bookId);
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  // sprawdzenie czy ksiazka jest w aktywnych transakcjach
  const activeTransactions = await Transaction.find({
    $or: [{ requestedBook: bookId }, { offeredBooks: bookId }],
    status: { $in: ["pending", "accepted"] },
  });

  if (activeTransactions.length > 0) {
    return NextResponse.json(
      {
        error:
          "Cannot delete book that is part of an active transaction. Please wait until the transaction is completed or cancel it first.",
      },
      { status: 400 }
    );
  }

  // snapshot w osobnej kolekcji
  const snapshotExists = await BookSnapshot.findOne({ originalBookId: bookId });

  if (!snapshotExists) {
    await BookSnapshot.create({
      originalBookId: book._id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      description: book.description,
      imageUrl: book.imageUrl,
      condition: book.condition,
      ownerNote: book.ownerNote,
    });
  }

  // usuwanie wszystkich konwersacji powiazanych z ksiazka
  const conversations = await Conversation.find({ book: bookId });
  const conversationIds = conversations.map((c) => c._id);

  if (conversationIds.length > 0) {
    await Message.deleteMany({ conversation: { $in: conversationIds } });
    await Conversation.deleteMany({ book: bookId });
  }

  // usuwanie z oferowanych ksiazek uzytkownika
  user.offeredBooks = user.offeredBooks.filter(
    (id) => id.toString() !== bookId
  );
  await user.save();

  // usuwanie ksiazki z bazy danych (jest snapshot)
  await Book.findByIdAndDelete(bookId);

  return NextResponse.json({ message: "Removed from offered books" });
}
