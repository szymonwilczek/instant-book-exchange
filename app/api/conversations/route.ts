import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Conversation from "@/lib/models/Conversation";
import User from "@/lib/models/User";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since");
    const sinceDate = since ? new Date(parseInt(since)) : new Date(0);

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

    // konwersacje gdzie uzytkownik jest uczestnikiem
    const conversations = await Conversation.find({
      participants: { $in: [user._id] },
      updatedAt: { $gte: sinceDate },
    })
      .sort({ updatedAt: -1 })
      .populate("participants", "email name username profileImage")
      .populate("book", "title imageUrl author _id")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "_id email name username profileImage",
        },
      })
      .limit(50);

    // dane dla pollingu
    const updates = conversations.map((conv) => ({
      _id: conv._id,
      conversationId: conv._id,
      updatedAt: conv.updatedAt,
      participants: conv.participants,
    }));

    return NextResponse.json({
      conversations,
      updates,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { participantId, bookId } = await req.json();

    if (!participantId || !bookId) {
      return NextResponse.json(
        { error: "participantId and bookId are required" },
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

    const currentUser = await User.findOne({ email: userEmail });
    if (!currentUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const participantUser = await User.findById(participantId);
    if (!participantUser)
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );

    // czy istnieje juz konwersacja miedzy tymi uzytkownikami dla tej ksiazki
    const existingConversation = await Conversation.findOne({
      participants: { $all: [currentUser._id, participantUser._id] },
      book: bookId,
    });

    if (existingConversation) {
      const populatedConversation = await Conversation.findById(
        existingConversation._id
      )
        .populate("participants", "email name username profileImage")
        .populate("book", "title imageUrl author _id");

      return NextResponse.json({
        conversation: populatedConversation,
        existed: true,
      });
    }

    const newConversation = new Conversation({
      participants: [currentUser._id, participantUser._id],
      book: bookId,
    });

    await newConversation.save();

    const populatedConversation = await Conversation.findById(
      newConversation._id
    )
      .populate("participants", "email name username profileImage")
      .populate("book", "title imageUrl author _id");

    return NextResponse.json({
      conversation: populatedConversation,
      existed: false,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
