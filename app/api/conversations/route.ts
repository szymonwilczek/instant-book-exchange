import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Conversation from "@/lib/models/Conversation";
import User from "@/lib/models/User";
import Book from "@/lib/models/Book";
import type { Types } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const conversations = await Conversation.find({
      participants: user._id,
      deletedBy: { $ne: user._id },
    })
      .populate("participants", "username email profileImage")
      .populate("book", "title imageUrl author")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      console.log("No session or email");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookId, participantId } = body;

    console.log("Creating conversation:", {
      bookId,
      participantId,
      userEmail: session.user.email,
    });

    if (!bookId || !participantId) {
      console.log("Missing bookId or participantId");
      return NextResponse.json(
        { error: "Book ID and participant ID required" },
        { status: 400 }
      );
    }

    await connectToDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      console.log("User not found:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      console.log("Book not found:", bookId);
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const recipient = await User.findById(participantId);
    if (!recipient) {
      console.log("Recipient not found:", participantId);
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    if (user._id.toString() === participantId) {
      console.log("User trying to message themselves");
      return NextResponse.json(
        { error: "Cannot message yourself" },
        { status: 400 }
      );
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [user._id, participantId] },
      book: bookId,
    });

    if (conversation) {
      console.log("Conversation exists, reopening:", conversation._id);
      conversation.deletedBy = conversation.deletedBy.filter(
        (id: Types.ObjectId) => !id.equals(user._id)
      );
      await conversation.save();
    } else {
      console.log("Creating new conversation");
      conversation = await Conversation.create({
        participants: [user._id, participantId],
        book: bookId,
        deletedBy: [],
      });
      console.log("Conversation created:", conversation._id);
    }

    await conversation.populate("participants", "username email profileImage");
    await conversation.populate("book", "title imageUrl author");

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      {
        error: "Failed to create conversation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
