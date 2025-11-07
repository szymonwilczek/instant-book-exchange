import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Message from "@/lib/models/Message";
import Conversation from "@/lib/models/Conversation";
import User from "@/lib/models/User";
import type { Types } from "mongoose";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");
  const limit = parseInt(searchParams.get("limit") || "50");
  const before = searchParams.get("before");

  if (!conversationId) {
    return NextResponse.json(
      { error: "Conversation ID required" },
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
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  const isParticipant = conversation.participants.some((p: Types.ObjectId) =>
    p.equals(user._id)
  );
  if (!isParticipant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const query: { conversation: string; _id?: { $lt: string } } = {
    conversation: conversationId,
  };
  if (before) {
    query._id = { $lt: before };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("sender", "username email profileImage");

  return NextResponse.json({ messages: messages.reverse() });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { conversationId, content, attachments } = await req.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID required" },
        { status: 400 }
      );
    }

    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: "Content or attachments required" },
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
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const isParticipant = conversation.participants.some((p: Types.ObjectId) =>
      p.equals(user._id)
    );
    if (!isParticipant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: user._id,
      content,
      attachments: attachments || [],
      readBy: [user._id],
      deliveredTo: [user._id],
    });

    // aktualizacja lastMessage w konwersacji
    conversation.lastMessage = message._id as Types.ObjectId;
    conversation.updatedAt = new Date();
    await conversation.save();

    await message.populate("sender", "_id username name email profileImage");

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      {
        error: "Failed to send message",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
