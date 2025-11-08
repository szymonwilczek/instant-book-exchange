import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Message from "@/lib/models/Message";
import Conversation from "@/lib/models/Conversation";
import User from "@/lib/models/User";
import type { Types } from "mongoose";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { conversationId, participantEmails, message } = await req.json();

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: "Conversation ID and message required" },
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

    if (participantEmails && Array.isArray(participantEmails)) {
      const participants = await User.find({
        email: { $in: participantEmails, $ne: userEmail },
      });

      const participantIds = participants.map((p) => p._id);

      await Message.updateOne(
        { _id: message._id },
        {
          $addToSet: { deliveredTo: { $each: participantIds } },
        }
      );
    }

    console.log(
      `Message event processed for ${conversationId}: ${message.content.substring(0, 30)}...`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in send-socket-event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
